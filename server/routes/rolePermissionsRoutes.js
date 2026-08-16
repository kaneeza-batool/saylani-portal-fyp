const express = require('express');
const { getSubAdmins, updateSubAdminPermissions, grantFullAccess } = require('../controllers/rolePermissionsController');
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');

const router = express.Router();

// Editing another admin's permission grants is a super_admin-only action —
// no sub_admin, however permissioned, ever reaches this router.
router.use(protect, restrictTo('super_admin'));

router.get('/sub-admins', getSubAdmins);
router.patch('/sub-admins/:id', updateSubAdminPermissions);
router.patch('/sub-admins/:id/full-access', grantFullAccess);

module.exports = router;
