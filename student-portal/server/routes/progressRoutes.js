const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { getProgress } = require('../controllers/progressController');

const router = express.Router();

router.use(protect);

router.get('/:courseId', getProgress);

module.exports = router;
