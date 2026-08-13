const Slot = require('../models/Slot');
const Student = require('../models/Student');
const { buildCrudController } = require('../utils/crudFactory');
const { buildCrudRouter } = require('../utils/crudRouter');
const { campusScope } = require('../middleware/campusScope');
const { checkPermission } = require('../middleware/checkPermission');

// Student.batch is only ever set for roster members (see
// backfillStudentBatch.js / studentController.js — 'pending'/'rejected'
// applicants never get one), so a plain count against it is already
// "students actually in this batch" with no extra status filter needed.
async function withStudentCounts(slots) {
  if (slots.length === 0) return slots;
  const counts = await Student.aggregate([
    { $match: { batch: { $in: slots.map((s) => s._id) } } },
    { $group: { _id: '$batch', count: { $sum: 1 } } },
  ]);
  const countBySlotId = new Map(counts.map((c) => [String(c._id), c.count]));
  return slots.map((s) => ({ ...s.toObject(), studentCount: countBySlotId.get(String(s._id)) ?? 0 }));
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
