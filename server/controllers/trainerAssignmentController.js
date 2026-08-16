const StudentPortalAssignment = require('../models/StudentPortalAssignment');
const StudentPortalAssignmentSubmission = require('../models/StudentPortalAssignmentSubmission');
const StudentPortalNotification = require('../models/StudentPortalNotification');
const Student = require('../models/Student');
const { sendMail } = require('../utils/mailer');
const { logAudit } = require('../utils/auditLogger');

// Same fixed course list as trainerQuizController.js — kept local rather
// than shared, matching how course lists are duplicated elsewhere in this
// codebase (Student.COURSES vs Trainer's free-text course) rather than
// introducing a new shared-constants module for one array.
const COURSES = [
  'Web Development',
  'AI & Data Science',
  'Graphic Designing',
  'Mobile App Development (Flutter)',
  'Digital Marketing',
  'UI/UX Design',
  'Cybersecurity Fundamentals',
];

exports.createAssignment = async (req, res) => {
  try {
    const { course, title, description, dueDate, isHackathon, referenceLinks } = req.body;
    if (!course || !title?.trim() || !description?.trim() || !dueDate) {
      return res.status(400).json({ message: 'Course, title, description, and due date are all required.' });
    }
    if (!COURSES.includes(course)) {
      return res.status(400).json({ message: 'Selected course is not recognized.' });
    }

    const assignment = await StudentPortalAssignment.create({
      course,
      title: title.trim(),
      description: description.trim(),
      dueDate,
      isHackathon: Boolean(isHackathon),
      referenceLinks: Array.isArray(referenceLinks) ? referenceLinks.filter((l) => l?.trim()) : [],
      createdByTrainer: req.user._id,
    });

    logAudit({
      actor: req.user,
      action: 'create',
      resourceType: 'StudentPortalAssignment',
      resourceId: assignment._id,
      summary: `Created assignment "${assignment.title}" for ${assignment.course}`,
    });

    return res.status(201).json({ assignment });
  } catch (err) {
    if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
    return res.status(500).json({ message: 'Failed to create assignment', error: err.message });
  }
};

// Each assignment gets 3 counts for the list view's stat badges: how many
// students have submitted at all (submitted/late/approved/not_approved —
// everything except never-submitted), how many of those are still waiting
// on a decision, and how many are approved. Computed against the real
// enrolled roster for the assignment's course, not just however many
// submission documents happen to exist, so "Submitted" genuinely means
// "out of everyone assigned this."
exports.listMyAssignments = async (req, res) => {
  try {
    const assignments = await StudentPortalAssignment.find({ createdByTrainer: req.user._id }).sort({ createdAt: -1 }).lean();

    const withCounts = await Promise.all(
      assignments.map(async (a) => {
        const submissions = await StudentPortalAssignmentSubmission.find({ assignment: a._id }, 'status').lean();
        const submitted = submissions.length;
        const approved = submissions.filter((s) => s.status === 'approved').length;
        const pending = submissions.filter((s) => ['submitted', 'late_submitted'].includes(s.status)).length;
        return { ...a, stats: { submitted, pending, approved } };
      })
    );

    return res.status(200).json({ items: withCounts });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load your assignments', error: err.message });
  }
};

// Full roster for one assignment: every enrolled/completed student in that
// assignment's course (the real relationship this schema supports — see
// StudentPortalAssignment.js on why this is course-scoped, not batch-
// scoped), left-joined with their submission for THIS assignment if one
// exists. A student who never submitted still gets a row, status
// 'not_submitted' — this is what makes the detail view a real roster
// instead of just a list of whoever happened to submit.
exports.getAssignmentRoster = async (req, res) => {
  try {
    const { id } = req.params;
    const assignment = await StudentPortalAssignment.findById(id).lean();
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
    if (String(assignment.createdByTrainer) !== String(req.user._id)) {
      return res.status(403).json({ message: 'You can only view rosters for your own assignments.' });
    }

    const submissions = await StudentPortalAssignmentSubmission.find({ assignment: id }).lean();
    const submissionByStudent = new Map(submissions.map((s) => [String(s.student), s]));

    // Roster = currently-enrolled students in this course, UNION anyone who
    // already submitted here regardless of their current status. Without
    // the union half, a student who submitted and was later marked
    // 'dropout' (e.g. by the auto-dropout-on-overdue-payment feature)
    // would silently vanish from the roster — their real, possibly
    // already-approved submission would become unreachable through this
    // view even though the submission document itself is untouched.
    const currentlyEnrolled = await Student.find(
      { course: assignment.course, status: { $in: ['enrolled', 'completed'] } },
      'name email'
    ).lean();

    const submittedStudentIds = [...submissionByStudent.keys()].filter(
      (id) => !currentlyEnrolled.some((s) => String(s._id) === id)
    );
    const pastSubmitters = submittedStudentIds.length
      ? await Student.find({ _id: { $in: submittedStudentIds } }, 'name email').lean()
      : [];

    const students = [...currentlyEnrolled, ...pastSubmitters].sort((a, b) => a.name.localeCompare(b.name));

    const roster = students.map((student) => {
      const submission = submissionByStudent.get(String(student._id));
      return {
        student: { _id: student._id, name: student.name },
        submissionId: submission?._id || null,
        status: submission?.status || 'not_submitted',
        submittedAt: submission?.submittedAt || null,
        submissionLink: submission?.submissionLink || '',
        grade: submission?.grade || '',
        trainerRemarks: submission?.trainerRemarks || '',
      };
    });

    return res.status(200).json({ assignment, roster });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load assignment roster', error: err.message });
  }
};

// Submissions awaiting a decision (submitted / late_submitted), scoped to
// assignments THIS trainer created — a trainer never sees another
// trainer's submissions to review, same ownership boundary as "my quizzes".
exports.listSubmissionsForReview = async (req, res) => {
  try {
    const myAssignmentIds = await StudentPortalAssignment.find({ createdByTrainer: req.user._id }, '_id').lean();
    const ids = myAssignmentIds.map((a) => a._id);

    const submissions = await StudentPortalAssignmentSubmission.find({
      assignment: { $in: ids },
      status: { $in: ['submitted', 'late_submitted'] },
    })
      .populate('student', 'name email')
      .populate('assignment', 'title dueDate')
      .sort({ submittedAt: 1 })
      .lean();

    return res.status(200).json({ items: submissions });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load submissions', error: err.message });
  }
};

// Same list, but every decision already made — a trainer's record of past
// reviews, not just a queue of what's left.
exports.listReviewedSubmissions = async (req, res) => {
  try {
    const myAssignmentIds = await StudentPortalAssignment.find({ createdByTrainer: req.user._id }, '_id').lean();
    const ids = myAssignmentIds.map((a) => a._id);

    const submissions = await StudentPortalAssignmentSubmission.find({
      assignment: { $in: ids },
      status: { $in: ['approved', 'not_approved'] },
    })
      .populate('student', 'name email')
      .populate('assignment', 'title dueDate')
      .sort({ updatedAt: -1 })
      .limit(50)
      .lean();

    return res.status(200).json({ items: submissions });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load reviewed submissions', error: err.message });
  }
};

exports.reviewSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const { decision, grade, trainerRemarks } = req.body;
    if (!['approved', 'not_approved'].includes(decision)) {
      return res.status(400).json({ message: 'decision must be "approved" or "not_approved".' });
    }

    const submission = await StudentPortalAssignmentSubmission.findById(id).populate('assignment', 'title createdByTrainer');
    if (!submission) return res.status(404).json({ message: 'Submission not found' });

    // Ownership check, not just existence — a trainer can only review
    // submissions to assignments they themselves created, enforced
    // server-side the same way admissionController scopes by campus.
    if (String(submission.assignment.createdByTrainer) !== String(req.user._id)) {
      return res.status(403).json({ message: 'You can only review submissions to your own assignments.' });
    }

    submission.status = decision;
    submission.grade = grade || '';
    submission.trainerRemarks = trainerRemarks || '';
    await submission.save();

    logAudit({
      actor: req.user,
      action: 'update',
      resourceType: 'StudentPortalAssignmentSubmission',
      resourceId: submission._id,
      summary: `Reviewed submission for "${submission.assignment.title}" as ${decision}`,
    });

    // Best-effort — a failed email/notification must never block the
    // review itself from being recorded (same tolerance as
    // jobApplicationController's status-change emails).
    const student = await Student.findById(submission.student).select('name email');

    try {
      await StudentPortalNotification.create({
        student: submission.student,
        icon: '📝',
        title: 'Assignment Graded',
        message: `Your submission for "${submission.assignment.title}" was ${decision === 'approved' ? 'approved' : 'marked for revision'}${grade ? ` — grade: ${grade}` : ''}.`,
        link: '/assignments',
      });
    } catch (notifyErr) {
      console.error('Failed to create assignment-graded notification:', notifyErr.message);
    }

    if (student?.email) {
      const decisionLabel = decision === 'approved' ? 'Approved' : 'Needs Revision';
      const decisionColor = decision === 'approved' ? '#1B6B45' : '#C0392B';
      sendMail({
        to: student.email,
        subject: `TITAN — Your assignment "${submission.assignment.title}" has been reviewed`,
        html: `<div style="font-family:sans-serif;padding:16px">
          <h2 style="color:#12234A;margin:0 0 8px">Assignment Reviewed</h2>
          <p style="color:#333;margin:0 0 6px">Hi ${student.name},</p>
          <p style="color:${decisionColor};font-weight:600;text-transform:uppercase;font-size:12px;margin:0 0 6px">${decisionLabel}</p>
          ${grade ? `<p style="color:#333;margin:0 0 6px"><strong>Grade:</strong> ${grade}</p>` : ''}
          ${trainerRemarks ? `<p style="color:#333;margin:0 0 6px"><strong>Trainer remarks:</strong> ${trainerRemarks}</p>` : ''}
          <p style="color:#666;font-size:13px;margin:12px 0 0">Log in to Student Portal to see full details.</p>
        </div>`,
      }).catch(() => {});
    }

    return res.status(200).json({ submission });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to review submission', error: err.message });
  }
};

exports.getPendingReviewCount = async (req, res) => {
  try {
    const myAssignmentIds = await StudentPortalAssignment.find({ createdByTrainer: req.user._id }, '_id').lean();
    const ids = myAssignmentIds.map((a) => a._id);
    const count = await StudentPortalAssignmentSubmission.countDocuments({
      assignment: { $in: ids },
      status: { $in: ['submitted', 'late_submitted'] },
    });
    return res.status(200).json({ count });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load pending review count', error: err.message });
  }
};
