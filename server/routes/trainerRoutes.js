const Trainer = require('../models/Trainer');
const { buildCrudController } = require('../utils/crudFactory');
const { buildCrudRouter } = require('../utils/crudRouter');
const { campusScope } = require('../middleware/campusScope');
const { checkPermission } = require('../middleware/checkPermission');

const controller = buildCrudController(Trainer, {
  searchFields: ['name', 'email', 'employeeId', 'course', 'city'],
  resourceType: 'Trainer',
  label: (doc) => doc.name,
  populate: [{ path: 'campus', select: 'name city' }],
});

// sub_admin can list trainers (campus-scoped via campusScope), same pattern
// as students — create/update/delete stay super_admin-only.
module.exports = buildCrudRouter(controller, {
  listRoles: ['super_admin', 'sub_admin'],
  listMiddleware: [campusScope, checkPermission('TRAINER', 'read')],
});
