const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { getFullLeaderboard } = require('../controllers/leaderboardController');

const router = express.Router();

router.use(protect);

router.get('/', getFullLeaderboard);

module.exports = router;
