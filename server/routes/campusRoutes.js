const Campus = require('../models/Campus');
const { buildCrudController } = require('../utils/crudFactory');
const { buildCrudRouter } = require('../utils/crudRouter');

const controller = buildCrudController(Campus, {
  searchFields: ['name', 'city', 'phone'],
  resourceType: 'Campus',
  label: (doc) => doc.name,
});

// sub_admin can read the campus list (needed for campus pickers), but
// campus management itself stays super_admin-only.
module.exports = buildCrudRouter(controller, { readRoles: ['super_admin', 'sub_admin'] });
