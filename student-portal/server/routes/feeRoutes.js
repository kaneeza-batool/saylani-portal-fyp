const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { getFeeHistory, getFeeSummary } = require('../controllers/feeController');

const router = express.Router();

router.use(protect);

router.get('/:courseId/history', getFeeHistory);
router.get('/:courseId/summary', getFeeSummary);

module.exports = router;
