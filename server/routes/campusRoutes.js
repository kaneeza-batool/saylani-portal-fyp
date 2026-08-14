const Campus = require('../models/Campus');
const { buildCrudController } = require('../utils/crudFactory');
const { buildCrudRouter } = require('../utils/crudRouter');

const controller = buildCrudController(Campus, {
  searchFields: ['name', 'city', 'phone'],
  resourceType: 'Campus',
  label: (doc) => doc.name,
});

// Unlike other resources, a Campus record's own scope key is its `_id`
// (see crudFactory's resolveResourceCampus comment), not a `campus` field —
// so the shared campusScope middleware doesn't apply here.
function ownCampusOnly(req, res, next) {
  req.campusFilter = req.user.role === 'super_admin' ? {} : { _id: req.user.campus_id };
  next();
}

// sub_admin can list only their own campus (needed for campus pickers in
// Student/Trainer forms) — GET /:id and campus management stay
// super_admin-only so a sub_admin can't look up other campuses by id.
module.exports = buildCrudRouter(controller, {
  readRoles: ['super_admin'],
  listRoles: ['super_admin', 'sub_admin'],
  listMiddleware: [ownCampusOnly],
});
