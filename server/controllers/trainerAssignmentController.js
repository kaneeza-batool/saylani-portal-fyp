const StudentPortalAssignment = require('../models/StudentPortalAssignment');
const StudentPortalAssignmentSubmission = require('../models/StudentPortalAssignmentSubmission');
const Student = require('../models/Student');
const { sendMail } = require('../utils/mailer');

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

    return res.status(201).json({ assignment });
  } catch (err) {
    if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
    return res.status(500).json({ message: 'Failed to create assignment', error: err.message });
  }
};

exports.listMyAssignments = async (req, res) => {
  try {
    const assignments = await StudentPortalAssignment.find({ createdByTrainer: req.user._id }).sort({ createdAt: -1 }).lean();
    return res.status(200).json({ items: assignments });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load your assignments', error: err.message });
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

    // Best-effort — a failed email must never block the review itself
    // from being recorded (same tolerance as jobApplicationController's
    // status-change emails).
    const student = await Student.findById(submission.student).select('name email');
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
