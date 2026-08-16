const express = require('express');
const {
  lookupStudent,
  markAttendance,
  markMultiple,
  getAttendance,
  getStudentAttendanceRecords,
  updateAttendanceRecord,
} = require('../controllers/studentAttendanceController');
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');
const { campusScope } = require('../middleware/campusScope');
const { checkPermission } = require('../middleware/checkPermission');

const router = express.Router();

// Same pattern as attendanceSummaryRoutes.js: role-open to both, campusScope
// for the controllers that can use req.campusFilter directly (lookup/mark/
// mark-multiple, via Student's real campus ref), permission-gated per
// action rather than a blanket role gate.
router.use(protect, restrictTo('super_admin', 'sub_admin'), campusScope);

router.get('/', checkPermission('ATTENDANCE_VIEW', 'read'), getAttendance);
router.get('/lookup/:rollNumber', checkPermission('ATTENDANCE_MARK', 'read'), lookupStudent);
router.post('/mark', checkPermission('ATTENDANCE_MARK', 'write'), markAttendance);
router.post('/mark-multiple', checkPermission('ATTENDANCE_ADD_MULTI', 'write'), markMultiple);
router.get('/student/:studentId', checkPermission('ATTENDANCE_VIEW', 'read'), getStudentAttendanceRecords);
router.patch('/:id', checkPermission('ATTENDANCE_MARK', 'update'), updateAttendanceRecord);

module.exports = router;
