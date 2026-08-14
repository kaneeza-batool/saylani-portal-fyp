const express = require('express');
const { getAttendanceSummary, getAttendanceReports } = require('../controllers/studentAttendanceController');
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

// campusScope's output isn't used by getAttendanceReports (see its own
// comment — Student.campus is scoped directly, StudentAttendance.campus via
// a resolved name), but it still runs here for consistency with every other
// campus-scoped route in the chain.
router.get(
  '/reports',
  protect,
  restrictTo('super_admin', 'sub_admin'),
  campusScope,
  checkPermission('ATTENDANCE_VIEW', 'read'),
  getAttendanceReports
);

module.exports = router;
