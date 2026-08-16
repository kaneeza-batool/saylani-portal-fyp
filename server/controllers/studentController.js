const Student = require('../models/Student');
const Slot = require('../models/Slot');
const FeeVoucher = require('../models/FeeVoucher');
const { logAudit } = require('../utils/auditLogger');
const { currentMonthLabel, isOverdue, BILLABLE_STATUSES } = require('../utils/feePlan');
const { computeCourseProgress } = require('../utils/courseProgress');

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Shared by create/update. `batchId` is falsy/omitted-safe (returns null
// batch, no error). Never trusts the client on scope: a sub_admin can only
// point a student at a Slot in their own campus, regardless of what the
// request body claims — checked against the Slot's real campus, not the
// campus the client says it picked. Also checked against `targetCampusId`
// (the campus the student will actually end up in after this write) so a
// batch can't silently end up pointing at a different campus than its
// student.
async function resolveBatchAssignment(user, targetCampusId, batchId) {
  if (!batchId) return { ok: true, batch: null };

  const slot = await Slot.findById(batchId).select('campus');
  if (!slot) return { ok: false, status: 400, message: 'Batch not found' };

  if (user.role !== 'super_admin' && String(slot.campus) !== String(user.campus_id)) {
    return { ok: false, status: 403, message: 'You can only assign batches within your own campus' };
  }
  if (targetCampusId && String(slot.campus) !== String(targetCampusId)) {
    return { ok: false, status: 400, message: "Batch does not belong to the student's campus" };
  }
  return { ok: true, batch: slot._id };
}

exports.getStudents = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const { search, status, roster } = req.query;

    const filter = { ...req.campusFilter };
    // roster=true excludes admissions applicants (pending/rejected) — opt-in
    // so this endpoint's default behavior (used by super-admin StudentsPage)
    // is unchanged. A specific `status` still narrows further/overrides it.
    //
    // roster=active is the same idea but also excludes dropout — used only
    // by the sub-admin Dashboard KPI card, by explicit request: everywhere
    // else in the app ("Students" on the super-admin Dashboard, Reports,
    // Campus Map) deliberately counts dropout as part of the roster, kept
    // consistent on purpose (see project memory on the 2026-08-16 count
    // reconciliation). The sub-admin Dashboard is a deliberate, scoped
    // exception to that convention, not a drift to fix back.
    if (roster === 'true') {
      filter.status = { $nin: ['pending', 'rejected'] };
    } else if (roster === 'active') {
      filter.status = { $nin: ['pending', 'rejected', 'dropout'] };
    }
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (search && search.trim()) {
      const re = new RegExp(escapeRegex(search.trim()), 'i');
      filter.$or = [{ name: re }, { cnic: re }, { phone: re }, { email: re }];
    }

    const [students, total] = await Promise.all([
      Student.find(filter)
        .populate('campus', 'name city')
        .populate('batch', 'schedule course')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Student.countDocuments(filter),
    ]);

    // feeStatus drives the Students table's Payment Status column and its
    // per-row "generate" action — computed here (not read off Student.payment,
    // a separate manually-edited field, see Student.js) from whether a
    // FeeVoucher exists for the current month, same status/overdue logic as
    // feeController.getFees. Only computed for billable (roster) students —
    // pending/rejected applicants were never billed, so null for those.
    const billableIds = students.filter((s) => BILLABLE_STATUSES.includes(s.status)).map((s) => s._id);
    const month = currentMonthLabel();
    const vouchers = billableIds.length
      ? await FeeVoucher.find({ student: { $in: billableIds }, month }).lean()
      : [];
    const voucherByStudentId = new Map(vouchers.map((v) => [String(v.student), v]));
    const now = new Date();

    // Same population as feeStatus (billable = has actually had a real
    // course journey) — a pending/rejected applicant never took a quiz or
    // submitted an assignment, so "progress" is meaningless for them.
    // Formula matches what the student sees on their own Student Portal
    // (see courseProgress.js) — previously this table showed no progress
    // number at all.
    const progressByStudentId = await computeCourseProgress(
      students.filter((s) => BILLABLE_STATUSES.includes(s.status)).map((s) => ({ _id: s._id, course: s.course }))
    );

    const studentsWithFeeStatus = students.map((s) => {
      const progress = progressByStudentId.get(String(s._id)) ?? null;

      if (!BILLABLE_STATUSES.includes(s.status)) return { ...s, feeStatus: null, progress: null };

      const voucher = voucherByStudentId.get(String(s._id));
      if (!voucher) return { ...s, feeStatus: { status: 'not_generated' }, progress };

      const status = voucher.status === 'paid' ? 'paid' : isOverdue(voucher, now) ? 'overdue' : 'pending';
      return {
        ...s,
        feeStatus: { status, dueDate: voucher.dueDate, amount: voucher.amount, voucherId: voucher.voucherId },
        progress,
      };
    });

    return res.status(200).json({
      students: studentsWithFeeStatus,
      total,
      page,
      limit,
      pages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load students', error: err.message });
  }
};

exports.getStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).populate('campus', 'name city').populate('batch', 'schedule course');
    if (!student) return res.status(404).json({ message: 'Student not found' });
    return res.status(200).json({ student });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load student', error: err.message });
  }
};

exports.createStudent = async (req, res) => {
  try {
    const {
      name,
      father,
      cnic,
      phone,
      email,
      course,
      campus,
      status,
      address,
      batch,
      employmentStatus,
      salary,
      companyName,
      jobTitle,
      employmentStartDate,
      computerProficiency,
      hasLaptop,
    } = req.body;
    if (!name || !father || !cnic || !phone || !email || !course || !campus) {
      return res.status(400).json({
        message: 'name, father, cnic, phone, email, course, and campus are required',
      });
    }

    const batchResult = await resolveBatchAssignment(req.user, campus, batch);
    if (!batchResult.ok) return res.status(batchResult.status).json({ message: batchResult.message });

    const student = await Student.create({
      name,
      father,
      cnic,
      phone,
      email,
      course,
      campus,
      batch: batchResult.batch,
      status: status || 'enrolled',
      address,
      payment: 'pending',
      employmentStatus,
      salary,
      companyName,
      jobTitle,
      employmentStartDate,
      computerProficiency,
      hasLaptop,
    });

    logAudit({
      actor: req.user,
      action: 'create',
      resourceType: 'Student',
      resourceId: student._id,
      summary: `Created student "${student.name}"`,
      resourceCampus: student.campus,
    });
    return res.status(201).json({ student });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'A student with this CNIC already exists' });
    }
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    return res.status(500).json({ message: 'Failed to create student', error: err.message });
  }
};

exports.updateStudent = async (req, res) => {
  try {
    const {
      name,
      father,
      cnic,
      phone,
      email,
      course,
      campus,
      status,
      payment,
      address,
      batch,
      employmentStatus,
      salary,
      companyName,
      jobTitle,
      employmentStartDate,
      computerProficiency,
      hasLaptop,
    } = req.body;

    // Pending/rejected are admissions-applicant states, only reachable
    // through the Admissions Queue's approve/reject flow (admissionController.js)
    // — enforced here too, not just by hiding the option in the UI, since a
    // sub_admin could otherwise bounce a roster student back to pending via
    // a direct API call and watch them silently vanish from their own roster
    // (which excludes pending/rejected — see getStudents' roster=true filter).
    if (req.user.role !== 'super_admin' && status && ['pending', 'rejected'].includes(status)) {
      return res.status(403).json({ message: 'Use the Admissions Queue to set a student to pending or rejected' });
    }

    // Needed before the write either way now: resolveBatchAssignment's
    // campus fallback (unchanged, see below) and the enrolled/dropout
    // cascade both have to know the student's pre-update state. Scoped by
    // req.campusFilter same as the final write, so a sub_admin gets the
    // same 404 for an out-of-campus id here as they would have anyway.
    const existing = await Student.findOne({ _id: req.params.id, ...req.campusFilter });
    if (!existing) return res.status(404).json({ message: 'Student not found' });

    // sub_admin can only ever target students in their own campus (see
    // req.campusFilter above), but the payload itself could still carry a
    // different campus id — drop it silently rather than let them reassign
    // a student out of their campus, or error on a form just re-submitting
    // the student's existing (unchanged) campus value.
    const updates = {
      name,
      father,
      cnic,
      phone,
      email,
      course,
      status,
      payment,
      address,
      employmentStatus,
      salary,
      companyName,
      jobTitle,
      employmentStartDate,
      computerProficiency,
      hasLaptop,
    };
    if (req.user.role === 'super_admin') {
      updates.campus = campus;
    }

    // Enrolled/dropout cascade — two independent triggers, `status` always
    // wins when both are present in the same request:
    //  - An ACTUAL status change (status !== existing.status, not just
    //    "status was in the payload") is always an intentional admin
    //    decision, tagged 'manual' and always allowed, overriding whatever
    //    dropReason was there before. Can't just check `status !==
    //    undefined` — StudentFormModal's edit form is a controlled <select>
    //    that always submits the current status, even on a request that
    //    only changed the phone number, so that alone isn't a reliable
    //    signal of intent.
    //  - A payment-only change (status didn't change in this request)
    //    cascades automatically: overdue while enrolled drops them
    //    ('payment' reason); recovering from overdue only re-enrolls them
    //    if that's *why* they were dropped — an attendance or manual
    //    dropout is never silently reopened just because a fee got marked
    //    paid.
    if (status !== undefined && status !== existing.status) {
      updates.dropReason = status === 'dropout' ? 'manual' : null;
    } else if (payment !== undefined && payment !== existing.payment) {
      if (payment === 'overdue' && existing.status === 'enrolled') {
        updates.status = 'dropout';
        updates.dropReason = 'payment';
      } else if (payment !== 'overdue' && existing.status === 'dropout' && existing.dropReason === 'payment') {
        updates.status = 'enrolled';
        updates.dropReason = null;
      }
    }

    // batch is optional and only touched when the client actually sent a
    // `batch` key — omitting it from the payload must not wipe an existing
    // assignment. sub_admin's target campus is always their own (they can
    // only reach students already inside req.campusFilter); super_admin's
    // target campus is whatever this same request just set above — except
    // a batch-only update (no `campus` key sent at all) leaves that
    // undefined, which used to skip resolveBatchAssignment's consistency
    // check entirely. Fall back to the student's existing campus in that
    // case, so a Sukkur student can't be silently pointed at a Karachi batch.
    if (batch !== undefined) {
      const targetCampusId = req.user.role === 'super_admin' ? campus || existing.campus : req.user.campus_id;
      const batchResult = await resolveBatchAssignment(req.user, targetCampusId, batch);
      if (!batchResult.ok) return res.status(batchResult.status).json({ message: batchResult.message });
      updates.batch = batchResult.batch;
    }

    const student = await Student.findOneAndUpdate(
      { _id: req.params.id, ...req.campusFilter },
      updates,
      { new: true, runValidators: true, context: 'query' }
    );

    if (!student) return res.status(404).json({ message: 'Student not found' });

    // Surface the cascade in the audit trail when it fired, not just "Updated
    // student" — an admin reading the log should see *why* status changed
    // even though they only touched the payment field.
    let summary = `Updated student "${student.name}"`;
    if (existing.status !== student.status) {
      summary =
        student.status === 'dropout'
          ? `Dropped "${student.name}" (${updates.dropReason === 'payment' ? 'payment overdue' : 'manual'})`
          : `Re-enrolled "${student.name}"${updates.dropReason === null && existing.dropReason === 'payment' ? ' (payment cleared)' : ''}`;
    }

    logAudit({
      actor: req.user,
      action: 'update',
      resourceType: 'Student',
      resourceId: student._id,
      summary,
      resourceCampus: student.campus,
    });
    return res.status(200).json({ student });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'A student with this CNIC already exists' });
    }
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    return res.status(500).json({ message: 'Failed to update student', error: err.message });
  }
};

exports.deleteStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    logAudit({
      actor: req.user,
      action: 'delete',
      resourceType: 'Student',
      resourceId: student._id,
      summary: `Deleted student "${student.name}"`,
      resourceCampus: student.campus,
    });
    return res.status(200).json({ message: 'Student deleted' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to delete student', error: err.message });
  }
};
