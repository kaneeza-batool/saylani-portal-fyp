const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { getFullLeaderboard } = require('../controllers/leaderboardController');

const router = express.Router();

router.use(protect);

router.get('/:courseId', getFullLeaderboard);

module.exports = router;
