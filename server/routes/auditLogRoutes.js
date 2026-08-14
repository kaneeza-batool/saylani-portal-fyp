const express = require('express');
const { getAuditLogs } = require('../controllers/auditLogController');
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');
const { campusScope } = require('../middleware/campusScope');
const { checkPermission } = require('../middleware/checkPermission');

const router = express.Router();

// AUDIT is read-only (see User.js permissionShape), same pattern as ALERTS —
// campusScope makes req.campusFilter `{}` for super_admin (unchanged
// behavior) and `{ campus: user.campus_id }` for sub_admin.
router.get('/', protect, restrictTo('super_admin', 'sub_admin'), campusScope, checkPermission('AUDIT', 'read'), getAuditLogs);

module.exports = router;
