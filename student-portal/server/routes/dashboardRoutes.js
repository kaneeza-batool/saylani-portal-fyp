const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  getDashboard,
  getProgressInsight,
  getLeaderboardPosition,
} = require('../controllers/dashboardController');

const router = express.Router();

router.use(protect);

router.get('/:courseId', getDashboard);
router.get('/:courseId/insight', getProgressInsight);
router.get('/:courseId/leaderboard', getLeaderboardPosition);

module.exports = router;
