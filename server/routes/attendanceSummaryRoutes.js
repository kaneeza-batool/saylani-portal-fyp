const express = require('express');
const { getAttendanceSummary } = require('../controllers/studentAttendanceController');
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');
const { campusScope } = require('../middleware/campusScope');
const { checkPermission } = require('../middleware/checkPermission');

const router = express.Router();

// Reuses ATTENDANCE_VIEW rather than a new permission module — viewing a
// summary percentage is a form of attendance viewing, same as the existing
// student-attendance list.
router.get(
  '/summary',
  protect,
  restrictTo('super_admin', 'sub_admin'),
  campusScope,
  checkPermission('ATTENDANCE_VIEW', 'read'),
  getAttendanceSummary
);

module.exports = router;
