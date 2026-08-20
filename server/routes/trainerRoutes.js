const Trainer = require('../models/Trainer');
const { buildCrudController } = require('../utils/crudFactory');
const { buildCrudRouter } = require('../utils/crudRouter');
const { campusScope } = require('../middleware/campusScope');
const { checkPermission } = require('../middleware/checkPermission');
const { restrictTo } = require('../middleware/roleMiddleware');
const { updateTrainerStatus } = require('../controllers/trainerStatusController');
const { resetTrainerPassword } = require('../controllers/trainerPasswordController');
const { createTrainer } = require('../controllers/trainerCreateController');

const controller = buildCrudController(Trainer, {
  searchFields: ['name', 'email', 'employeeId', 'course', 'city'],
  resourceType: 'Trainer',
  label: (doc) => doc.name,
  populate: [{ path: 'campus', select: 'name city' }],
});

// Trainer creation also has to mint a login (see trainerCreateController) —
// the generic crudFactory create only ever made the profile document, which
// is why trainers used to have to self-register separately for an account.
controller.create = createTrainer;

// A sub_admin's request body can't be trusted on campus — force it to their
// own regardless of what the client sends, same lockdown pattern
// studentController.createStudent applies for students. super_admin is
// left alone (whatever campus they submit).
function lockTrainerCampusForSubAdmin(req, res, next) {
  if (req.user.role === 'sub_admin') req.body.campus = req.user.campus_id;
  next();
}

// sub_admin can list trainers (campus-scoped via campusScope) and now also
// create one (scoped to their own campus via the lock above) — same
// pattern as students. update/delete stay super_admin-only via the
// default `roles`.
const router = buildCrudRouter(controller, {
  listRoles: ['super_admin', 'sub_admin'],
  listMiddleware: [campusScope, checkPermission('TRAINER', 'read')],
  createRoles: ['super_admin', 'sub_admin'],
  createMiddleware: [checkPermission('TRAINER', 'write'), lockTrainerCampusForSubAdmin],
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
