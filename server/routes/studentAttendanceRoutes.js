const express = require('express');
const {
  lookupStudent,
  markAttendance,
  markMultiple,
  getAttendance,
} = require('../controllers/studentAttendanceController');
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect, restrictTo('super_admin'));

router.get('/', getAttendance);
router.get('/lookup/:rollNumber', lookupStudent);
router.post('/mark', markAttendance);
router.post('/mark-multiple', markMultiple);

module.exports = router;
