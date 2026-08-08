const express = require('express');
const { getSummary } = require('../controllers/reportsController');
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');

const router = express.Router();

router.get('/summary', protect, restrictTo('super_admin'), getSummary);

module.exports = router;
