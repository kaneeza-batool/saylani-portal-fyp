const Assignment = require('../models/Assignment');
const AssignmentSubmission = require('../models/AssignmentSubmission');

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function daysUntil(dueDate) {
  return Math.ceil((new Date(dueDate).getTime() - Date.now()) / MS_PER_DAY);
}

exports.getAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find({ course: req.student.course }).sort({ dueDate: 1 });
    const submissions = await AssignmentSubmission.find({ student: req.student._id });
    const byAssignment = new Map(submissions.map((s) => [s.assignment.toString(), s]));

    const results = assignments.map((assignment) => {
      const submission = byAssignment.get(assignment._id.toString());
      return {
        _id: assignment._id,
        title: assignment.title,
        dueDate: assignment.dueDate,
        isHackathon: assignment.isHackathon,
        daysUntilDue: daysUntil(assignment.dueDate),
        status: submission ? submission.status : 'not_submitted',
        grade: submission?.grade || '',
      };
    });

    return res.status(200).json({ assignments: results });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load assignments', error: err.message });
  }
};

exports.getAssignmentDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const assignment = await Assignment.findOne({ _id: id, course: req.student.course });
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

    const submission = await AssignmentSubmission.findOne({ student: req.student._id, assignment: assignment._id });

    return res.status(200).json({
      assignment: {
        _id: assignment._id,
        title: assignment.title,
        description: assignment.description,
        referenceLinks: assignment.referenceLinks,
        dueDate: assignment.dueDate,
        isHackathon: assignment.isHackathon,
        daysUntilDue: daysUntil(assignment.dueDate),
      },
      submission: submission
        ? {
            submissionLink: submission.submissionLink,
            referenceImages: submission.referenceImages,
            submissionText: submission.submissionText,
            status: submission.status,
            grade: submission.grade,
            trainerRemarks: submission.trainerRemarks,
            submittedAt: submission.submittedAt,
            lastEditedAt: submission.lastEditedAt,
          }
        : null,
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load assignment', error: err.message });
  }
};

exports.submitAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const { submissionLink, referenceImages, submissionText } = req.body;
    if (!submissionLink || !submissionText) {
      return res.status(400).json({ message: 'Submission link and submission text are required' });
    }

    const assignment = await Assignment.findOne({ _id: id, course: req.student.course });
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

    const now = new Date();
    const status = now > assignment.dueDate ? 'late_submitted' : 'submitted';

    const existing = await AssignmentSubmission.findOne({ student: req.student._id, assignment: assignment._id });

    const submission = existing
      ? Object.assign(existing, {
          submissionLink,
          referenceImages: referenceImages || [],
          submissionText,
          status,
          lastEditedAt: now,
        })
      : new AssignmentSubmission({
          student: req.student._id,
          assignment: assignment._id,
          submissionLink,
          referenceImages: referenceImages || [],
          submissionText,
          status,
          submittedAt: now,
          lastEditedAt: now,
        });

    await submission.save();

    return res.status(existing ? 200 : 201).json({ submission });
  } catch (err) {
    if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
    return res.status(500).json({ message: 'Failed to submit assignment', error: err.message });
  }
};

exports.getSummaryStats = async (req, res) => {
  try {
    const assignments = await Assignment.find({ course: req.student.course }, '_id');
    const assignmentIds = assignments.map((a) => a._id);

    const submissions = await AssignmentSubmission.find(
      { student: req.student._id, assignment: { $in: assignmentIds } },
      'status'
    );

    const submitted = submissions.filter((s) => ['submitted', 'late_submitted'].includes(s.status)).length;
    const approved = submissions.filter((s) => s.status === 'approved').length;
    const notApproved = submissions.filter((s) => s.status === 'not_approved').length;

    return res.status(200).json({ total: assignments.length, submitted, approved, notApproved });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load assignment summary', error: err.message });
  }
};
