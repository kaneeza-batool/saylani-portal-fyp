const StudentPortalSupportFeedback = require('../models/StudentPortalSupportFeedback');
const Campus = require('../models/Campus');
const { logAudit, resolveCampusIdByName } = require('../utils/auditLogger');

// SupportFeedback.campus is cached from req.student.campus.name at
// submission time (see student-portal's submitFeedback) — the same full
// campus-name convention StudentAttendance already uses, so this reuses
// that resolver rather than the city-based one attendanceRequestController
// needs for the differently-sourced TrainerAttendance.campus.
async function resolveSubAdminCampusName(req) {
  const campus = await Campus.findById(req.user.campus_id).select('name');
  return campus?.name || '__no_campus__';
}

exports.getFeedback = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const { type, status } = req.query;

    const filter = {};
    if (type && type !== 'all') filter.type = type;
    if (status && status !== 'all') filter.status = status;
    if (req.user.role === 'sub_admin') filter.campus = await resolveSubAdminCampusName(req);

    const [items, total] = await Promise.all([
      StudentPortalSupportFeedback.find(filter)
        .populate('student', 'name rollNumber')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      StudentPortalSupportFeedback.countDocuments(filter),
    ]);

    return res.status(200).json({ items, total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load feedback', error: err.message });
  }
};

// Unlike attendance corrections (a single yes/no decision), a feedback
// thread can reasonably move pending -> reviewed -> resolved over several
// admin touches, and either Super Admin or Sub-Admin might respond at
// different points — so this isn't locked to a single first-writer-wins
// resolution the way resolveRequest is; the latest response simply wins.
exports.respondToFeedback = async (req, res) => {
  try {
    const { status, adminResponse } = req.body;
    if (status && !['pending', 'reviewed', 'resolved'].includes(status)) {
      return res.status(400).json({ message: 'status must be pending, reviewed, or resolved' });
    }

    const filter = { _id: req.params.id };
    if (req.user.role === 'sub_admin') filter.campus = await resolveSubAdminCampusName(req);

    const update = { respondedByName: req.user.name, respondedByRole: req.user.role };
    if (status) update.status = status;
    if (typeof adminResponse === 'string') update.adminResponse = adminResponse;

    const feedback = await StudentPortalSupportFeedback.findOneAndUpdate(filter, update, { new: true }).populate(
      'student',
      'name rollNumber'
    );
    if (!feedback) return res.status(404).json({ message: 'Feedback not found, or is not in your campus.' });

    logAudit({
      actor: req.user,
      action: 'update',
      resourceType: 'StudentFeedback',
      resourceId: feedback._id,
      summary: `Responded to ${feedback.type} feedback from "${feedback.student?.name || 'a student'}"`,
      resourceCampus: await resolveCampusIdByName(feedback.campus),
    });

    return res.status(200).json({ item: feedback });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update feedback', error: err.message });
  }
};
