const express = require('express');
const { getAlerts, resolveAlert } = require('../controllers/alertController');
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');
const { campusScope } = require('../middleware/campusScope');
const { checkPermission } = require('../middleware/checkPermission');

const router = express.Router();

router.use(protect);

// ALERTS is read-only (see User.js permissionShape) — sub_admin can view,
// resolving stays super_admin-only, same restriction as before this change.
router.get('/', restrictTo('super_admin', 'sub_admin'), campusScope, checkPermission('ALERTS', 'read'), getAlerts);
router.patch('/:id/resolve', restrictTo('super_admin'), resolveAlert);

module.exports = router;
