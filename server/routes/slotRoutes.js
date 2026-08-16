const Slot = require('../models/Slot');
const Student = require('../models/Student');
const { buildCrudController } = require('../utils/crudFactory');
const { buildCrudRouter } = require('../utils/crudRouter');
const { campusScope } = require('../middleware/campusScope');
const { checkPermission } = require('../middleware/checkPermission');

// Student.batch is only ever set for roster members (see
// backfillStudentBatch.js / studentController.js — 'pending'/'rejected'
// applicants never get one), but the status filter below is still explicit
// rather than relying on that invariant alone — same written definition
// ($nin: ['pending','rejected']) as every other student-count site in the
// app (dashboardController, reportsController, mapController, etc.), so
// this count can't silently drift from theirs if the invariant ever changes.
//
// Also overwrites `seatsFilled` in the response with this same live count.
// The stored field is set once at slot-creation time and nothing ever
// updates it when a student is later assigned/reassigned/dropped from a
// batch (see studentController.updateStudent), so trusting it directly
// drifts from reality almost immediately. Recomputing it here — rather
// than adding increment/decrement bookkeeping at every place Student.batch
// changes — keeps a single source of truth and matches studentCount, which
// already worked this way.
async function withStudentCounts(slots) {
  if (slots.length === 0) return slots;
  const counts = await Student.aggregate([
    { $match: { batch: { $in: slots.map((s) => s._id) }, status: { $nin: ['pending', 'rejected'] } } },
    { $group: { _id: '$batch', count: { $sum: 1 } } },
  ]);
  const countBySlotId = new Map(counts.map((c) => [String(c._id), c.count]));
  return slots.map((s) => {
    const count = countBySlotId.get(String(s._id)) ?? 0;
    return { ...s.toObject(), seatsFilled: count, studentCount: count };
  });
}

const controller = buildCrudController(Slot, {
  searchFields: ['schedule', 'trainer', 'course'],
  resourceType: 'Slot',
  label: (doc) => `${doc.course} — ${doc.schedule}`,
  populate: [{ path: 'campus', select: 'name city' }],
  annotate: withStudentCounts,
});

// sub_admin can list slots/batches (campus-scoped via campusScope), same
// pattern as students — create/update/delete stay super_admin-only.
module.exports = buildCrudRouter(controller, {
  listRoles: ['super_admin', 'sub_admin'],
  listMiddleware: [campusScope, checkPermission('BATCH', 'read')],
});
