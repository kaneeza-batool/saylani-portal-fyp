const express = require('express');
const { getAuditLogs } = require('../controllers/auditLogController');
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');

const router = express.Router();

router.get('/', protect, restrictTo('super_admin'), getAuditLogs);

module.exports = router;
