const Slot = require('../models/Slot');
const { buildCrudController } = require('../utils/crudFactory');
const { buildCrudRouter } = require('../utils/crudRouter');
const { campusScope } = require('../middleware/campusScope');
const { checkPermission } = require('../middleware/checkPermission');

const controller = buildCrudController(Slot, {
  searchFields: ['schedule', 'trainer', 'course'],
  resourceType: 'Slot',
  label: (doc) => `${doc.course} — ${doc.schedule}`,
});

// sub_admin can list slots/batches (campus-scoped via campusScope), same
// pattern as students — create/update/delete stay super_admin-only.
module.exports = buildCrudRouter(controller, {
  listRoles: ['super_admin', 'sub_admin'],
  listMiddleware: [campusScope, checkPermission('BATCH', 'read')],
});
