const Trainer = require('../models/Trainer');
const { buildCrudController } = require('../utils/crudFactory');
const { buildCrudRouter } = require('../utils/crudRouter');
const { campusScope } = require('../middleware/campusScope');
const { checkPermission } = require('../middleware/checkPermission');
const { restrictTo } = require('../middleware/roleMiddleware');
const { updateTrainerStatus } = require('../controllers/trainerStatusController');
const { resetTrainerPassword } = require('../controllers/trainerPasswordController');

const controller = buildCrudController(Trainer, {
  searchFields: ['name', 'email', 'employeeId', 'course', 'city'],
  resourceType: 'Trainer',
  label: (doc) => doc.name,
  populate: [{ path: 'campus', select: 'name city' }],
});

// sub_admin can list trainers (campus-scoped via campusScope), same pattern
// as students — create/update/delete stay super_admin-only.
const router = buildCrudRouter(controller, {
  listRoles: ['super_admin', 'sub_admin'],
  listMiddleware: [campusScope, checkPermission('TRAINER', 'read')],
});

// Status-only, sub_admin-reachable — deliberately separate from the
// generic PATCH /:id above (still super_admin-only), which would otherwise
// hand a sub_admin full trainer editing just to flip active/inactive.
// buildCrudRouter already applied `protect` to this router.
router.patch(
  '/:id/status',
  restrictTo('super_admin', 'sub_admin'),
  campusScope,
  checkPermission('TRAINER', 'write'),
  updateTrainerStatus
);

// Same reachability as /status above — sub_admin can reset a password for
// a trainer in their own campus without the generic PATCH /:id's full
// edit access.
router.patch(
  '/:id/reset-password',
  restrictTo('super_admin', 'sub_admin'),
  campusScope,
  checkPermission('TRAINER', 'write'),
  resetTrainerPassword
);

module.exports = router;
