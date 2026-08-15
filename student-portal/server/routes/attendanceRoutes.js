const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { getAttendanceSummary, getAttendanceByMonth, getStreak } = require('../controllers/attendanceController');

const router = express.Router();

router.use(protect);

router.get('/summary', getAttendanceSummary);
router.get('/monthly', getAttendanceByMonth);
router.get('/streak', getStreak);

module.exports = router;
