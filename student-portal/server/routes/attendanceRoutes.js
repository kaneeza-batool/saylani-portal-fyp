const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { getAttendanceSummary, getAttendanceByMonth, getStreak } = require('../controllers/attendanceController');

const router = express.Router();

router.use(protect);

router.get('/:courseId/summary', getAttendanceSummary);
router.get('/:courseId/monthly', getAttendanceByMonth);
router.get('/:courseId/streak', getStreak);

module.exports = router;
