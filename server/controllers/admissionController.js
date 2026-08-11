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

// Shared by approve/reject — only ever transitions a document that is
// currently 'pending', scoped to req.campusFilter the same way
// updateStudent's ownership fix works, so a sub_admin can't act on another
// campus's applicant (or re-approve/reject an already-decided one).
async function transitionAdmission(req, res, { toStatus, actionLabel }) {
  try {
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
    });

    return res.status(200).json({ student });
  } catch (err) {
    return res.status(500).json({ message: `Failed to ${actionLabel.toLowerCase()} admission`, error: err.message });
  }
}

exports.approveAdmission = (req, res) => transitionAdmission(req, res, { toStatus: 'enrolled', actionLabel: 'Approved' });

exports.rejectAdmission = (req, res) => transitionAdmission(req, res, { toStatus: 'rejected', actionLabel: 'Rejected' });
