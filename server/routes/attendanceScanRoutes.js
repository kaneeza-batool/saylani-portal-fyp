const express = require('express');
const { scanAttendance } = require('../controllers/attendanceScanController');
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');
const { campusScope } = require('../middleware/campusScope');

const router = express.Router();

// Super Admin/Sub-Admin's QR scanner — one endpoint, either a Student or
// Trainer ID card, auto-detected inside the controller from the decoded
// payload's `type`. Permission is checked per-type inside
// attendanceScanController.js (ATTENDANCE_MARK vs TRAINER_ATTENDANCE_MARK),
// not here, since a single route can't apply two different fixed
// checkPermission middlewares depending on request body content.
router.use(protect, restrictTo('super_admin', 'sub_admin'), campusScope);

router.post('/scan', scanAttendance);

module.exports = router;
