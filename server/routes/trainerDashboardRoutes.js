const express = require('express');
const { getMyBatches } = require('../controllers/trainerDashboardController');
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');

const router = express.Router();

router.get('/dashboard', protect, restrictTo('trainer'), getMyBatches);

module.exports = router;
