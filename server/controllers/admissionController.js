const Student = require('../models/Student');
const { logAudit } = require('../utils/auditLogger');

// Admissions has no collection of its own — an "admission" is just a
// Student document with status: 'pending' (see Student.STATUSES). This
// controller is a distinct feature/URL namespace built on top of Student,
// same relationship as studentAttendanceController.js has to Student.

exports.getAdmissions = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));

    const filter = { status: 'pending', ...req.campusFilter };

    const [students, total] = await Promise.all([
      Student.find(filter)
        .populate('campus', 'name city')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Student.countDocuments(filter),
    ]);

    return res.status(200).json({
      students,
      total,
      page,
      limit,
      pages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load admissions', error: err.message });
  }
};

// Shared by approve/reject — only pending -> enrolled and pending ->
// rejected are ever reachable (toStatus is hardcoded per endpoint below,
// never client-supplied). Scoped to req.campusFilter the same way
// updateStudent's ownership fix works, so a sub_admin can't act on another
// campus's applicant (or re-approve/reject an already-decided one).
//
// Two-step so a blocked attempt can be told apart from a genuine
// not-found and get its own audit trail: the existence/scope check runs
// first (still campus-filtered — an out-of-scope id stays a plain 404,
// same as before, so a sub_admin can't even learn another campus's
// applicant exists), then a status check that's now itself logged when it
// blocks something. The actual write stays gated by the same atomic
// findOneAndUpdate filter as before (belt-and-suspenders against a
// status change racing between these two reads).
async function transitionAdmission(req, res, { toStatus, actionVerb, actionLabel }) {
  try {
    const existing = await Student.findOne({ _id: req.params.id, ...req.campusFilter });
    if (!existing) return res.status(404).json({ message: 'Pending admission not found' });

    if (existing.status !== 'pending') {
      logAudit({
        actor: req.user,
        action: 'update',
        resourceType: 'Student',
        resourceId: existing._id,
        summary: `Rejected transition: attempted to ${actionVerb} "${existing.name}", but current status is "${existing.status}" (only a pending admission can be ${actionLabel.toLowerCase()})`,
        resourceCampus: existing.campus,
      });
      return res.status(400).json({
        message: `Only pending admissions can be ${actionLabel.toLowerCase()} — this student's current status is "${existing.status}".`,
      });
    }

    const student = await Student.findOneAndUpdate(
      { _id: req.params.id, status: 'pending', ...req.campusFilter },
      { status: toStatus },
      { new: true, runValidators: true, context: 'query' }
    );
    if (!student) return res.status(404).json({ message: 'Pending admission not found' });

    logAudit({
      actor: req.user,
      action: 'update',
      resourceType: 'Student',
      resourceId: student._id,
      summary: `${actionLabel} admission for "${student.name}"`,
      resourceCampus: student.campus,
    });

    return res.status(200).json({ student });
  } catch (err) {
    return res.status(500).json({ message: `Failed to ${actionVerb} admission`, error: err.message });
  }
}

exports.approveAdmission = (req, res) =>
  transitionAdmission(req, res, { toStatus: 'enrolled', actionVerb: 'approve', actionLabel: 'Approved' });

exports.rejectAdmission = (req, res) =>
  transitionAdmission(req, res, { toStatus: 'rejected', actionVerb: 'reject', actionLabel: 'Rejected' });
