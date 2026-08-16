const Student = require('../models/Student');
const Slot = require('../models/Slot');
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

// Only reachable from approveAdmission (never on reject). student.campus is
// already the applicant's own campus — since `student` came from a
// req.campusFilter-scoped query, restricting Slot.find to it is enough to
// keep this campus-scoped without any extra check. seatsFilled on Slot
// itself is stale (see slotRoutes.js:withStudentCounts) so availability is
// computed the same way the rest of the app does: a live count of
// non-pending/rejected students currently on each candidate batch.
// Deterministic even when several slots match (most open seats first, then
// oldest batch) — today's data never has more than one match per
// course+campus, but nothing enforces that staying true.
async function assignBatchOnApproval(student) {
  const candidates = await Slot.find({ course: student.course, campus: student.campus, status: 'active' });
  if (candidates.length === 0) {
    return { response: { batchAssignment: { assigned: false, reason: 'no_matching_batch' } } };
  }

  const slotIds = candidates.map((s) => s._id);
  const counts = await Student.aggregate([
    { $match: { batch: { $in: slotIds }, status: { $nin: ['pending', 'rejected'] } } },
    { $group: { _id: '$batch', count: { $sum: 1 } } },
  ]);
  const filledBySlot = new Map(counts.map((c) => [String(c._id), c.count]));

  const withRoom = candidates
    .map((slot) => ({ slot, available: slot.seatsTotal - (filledBySlot.get(String(slot._id)) ?? 0) }))
    .filter((c) => c.available > 0)
    .sort((a, b) => b.available - a.available || a.slot.createdAt - b.slot.createdAt);

  if (withRoom.length === 0) {
    return { response: { batchAssignment: { assigned: false, reason: 'no_seats_available' } } };
  }

  const winner = withRoom[0].slot;
  await Student.updateOne({ _id: student._id }, { batch: winner._id });
  student.batch = winner._id;

  return {
    auditSuffix: ` — assigned to batch "${winner.schedule}"`,
    response: { batchAssignment: { assigned: true, slotId: winner._id, schedule: winner.schedule } },
  };
}

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
//
// afterUpdate is approve-only (assignBatchOnApproval) — reject has no
// equivalent post-step. Its failure (or the whole batch-assignment step)
// never fails the approve itself: a student who can't be seated still gets
// enrolled, just flagged via response.batchAssignment for the UI to show.
async function transitionAdmission(req, res, { toStatus, actionVerb, actionLabel, afterUpdate }) {
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

    const extra = afterUpdate ? (await afterUpdate(student)) || {} : {};

    logAudit({
      actor: req.user,
      action: 'update',
      resourceType: 'Student',
      resourceId: student._id,
      summary: `${actionLabel} admission for "${student.name}"${extra.auditSuffix || ''}`,
      resourceCampus: student.campus,
    });

    return res.status(200).json({ student, ...extra.response });
  } catch (err) {
    return res.status(500).json({ message: `Failed to ${actionVerb} admission`, error: err.message });
  }
}

exports.approveAdmission = (req, res) =>
  transitionAdmission(req, res, {
    toStatus: 'enrolled',
    actionVerb: 'approve',
    actionLabel: 'Approved',
    afterUpdate: assignBatchOnApproval,
  });

exports.rejectAdmission = (req, res) =>
  transitionAdmission(req, res, { toStatus: 'rejected', actionVerb: 'reject', actionLabel: 'Rejected' });
