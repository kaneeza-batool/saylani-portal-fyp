const FeeVoucher = require('../models/FeeVoucher');
const Student = require('../models/Student');
const { logAudit } = require('../utils/auditLogger');

function isOverdue(voucher, now) {
  return voucher.status === 'pending' && new Date(voucher.dueDate) < now;
}

// FeeVoucher has no campus field of its own (see model) — Student.campus is
// the real ref, so campus scoping goes through the student roster first,
// same pattern as studentAttendanceController.getAttendanceReports.
exports.getFees = async (req, res) => {
  try {
    const { status, month, batch } = req.query;
    const now = new Date();

    const campusStudents = await Student.find(req.campusFilter, 'name rollNumber batch')
      .populate('batch', 'schedule course')
      .lean();

    if (campusStudents.length === 0) {
      return res.status(200).json({
        vouchers: [],
        months: [],
        summary: { totalCollected: 0, totalPending: 0, overdueCount: 0 },
      });
    }

    const studentById = new Map(campusStudents.map((s) => [String(s._id), s]));
    const campusStudentIds = [...studentById.keys()];

    // batch narrows which students' vouchers appear in the table; it does
    // NOT affect the summary cards below, which stay a stable whole-campus
    // overview (same "summary ignores table filters" convention as
    // feedbackController.getFeedback's trainerAverages).
    const tableStudentIds = batch
      ? campusStudents.filter((s) => String(s.batch?._id) === String(batch)).map((s) => String(s._id))
      : campusStudentIds;

    const voucherFilter = { student: { $in: tableStudentIds } };
    if (month) voucherFilter.month = month;
    if (status === 'paid') {
      voucherFilter.status = 'paid';
    } else if (status === 'pending') {
      voucherFilter.status = 'pending';
    } else if (status === 'overdue') {
      // Overdue is a computed subset of pending, not a stored enum value
      // (see model) — narrow pending further by dueDate here.
      voucherFilter.status = 'pending';
      voucherFilter.dueDate = { $lt: now };
    }

    const [vouchers, allVouchers] = await Promise.all([
      FeeVoucher.find(voucherFilter).sort({ dueDate: -1 }).lean(),
      FeeVoucher.find({ student: { $in: campusStudentIds } }, 'amount status dueDate month').lean(),
    ]);

    const rows = vouchers.map((v) => {
      const s = studentById.get(String(v.student));
      return {
        _id: v._id,
        voucherId: v.voucherId,
        student: s ? { _id: s._id, name: s.name, rollNumber: s.rollNumber } : null,
        batch: s?.batch ? { _id: s.batch._id, schedule: s.batch.schedule, course: s.batch.course } : null,
        amount: v.amount,
        month: v.month,
        dueDate: v.dueDate,
        status: v.status,
        overdue: isOverdue(v, now),
      };
    });

    const totalCollected = allVouchers.filter((v) => v.status === 'paid').reduce((sum, v) => sum + v.amount, 0);
    const totalPending = allVouchers.filter((v) => v.status === 'pending').reduce((sum, v) => sum + v.amount, 0);
    const overdueCount = allVouchers.filter((v) => isOverdue(v, now)).length;
    const months = [...new Set(allVouchers.map((v) => v.month))].sort((a, b) => new Date(a) - new Date(b));

    return res.status(200).json({
      vouchers: rows,
      months,
      summary: { totalCollected, totalPending, overdueCount },
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load fees', error: err.message });
  }
};

// Changes a voucher's due date and/or marks it paid. Unlike
// updateAttendanceRecord's "wrong campus reads as 404" (to avoid leaking
// that a roll number exists elsewhere), this deliberately returns 403 for a
// voucher that exists but belongs to another campus's student — fee data is
// resource-identified by :id, not looked up by a guessable roll number, so
// there's nothing to leak by confirming existence.
exports.updateFee = async (req, res) => {
  try {
    const { dueDate, status } = req.body;
    if (status !== undefined && status !== 'paid') {
      return res.status(400).json({ message: "status can only be set to 'paid' here" });
    }
    if (dueDate === undefined && status === undefined) {
      return res.status(400).json({ message: 'Provide dueDate and/or status to update' });
    }

    const voucher = await FeeVoucher.findById(req.params.id);
    if (!voucher) return res.status(404).json({ message: 'Fee voucher not found' });

    const student = await Student.findOne({ _id: voucher.student, ...req.campusFilter }).select('name campus');
    if (!student) return res.status(403).json({ message: 'You do not have access to this fee voucher' });

    const changes = [];
    if (dueDate !== undefined) {
      const newDueDate = new Date(dueDate);
      if (Number.isNaN(newDueDate.getTime())) return res.status(400).json({ message: 'Invalid dueDate' });
      if (newDueDate.getTime() !== voucher.dueDate.getTime()) {
        changes.push(`due date from ${voucher.dueDate.toDateString()} to ${newDueDate.toDateString()}`);
        voucher.dueDate = newDueDate;
      }
    }
    if (status === 'paid' && voucher.status !== 'paid') {
      changes.push(`status from ${voucher.status} to paid`);
      voucher.status = 'paid';
    }

    if (changes.length === 0) {
      return res.status(200).json({ voucher });
    }

    await voucher.save();

    logAudit({
      actor: req.user,
      action: 'update',
      resourceType: 'FeeVoucher',
      resourceId: voucher._id,
      summary: `Updated "${student.name}"'s fee voucher (${voucher.voucherId}): changed ${changes.join(' and ')}`,
      resourceCampus: student.campus,
    });

    return res.status(200).json({ voucher });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update fee voucher', error: err.message });
  }
};
