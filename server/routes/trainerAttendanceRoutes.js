const express = require('express');
const { lookupTrainer, checkIn, checkOut, getAttendance } = require('../controllers/trainerAttendanceController');
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect, restrictTo('super_admin'));

router.get('/', getAttendance);
router.get('/lookup/:employeeId', lookupTrainer);
router.post('/checkin', checkIn);
router.post('/checkout', checkOut);

module.exports = router;
