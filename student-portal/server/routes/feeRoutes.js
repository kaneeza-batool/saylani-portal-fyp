const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { getFeeHistory, getFeeSummary } = require('../controllers/feeController');

const router = express.Router();

router.use(protect);

router.get('/history', getFeeHistory);
router.get('/summary', getFeeSummary);

module.exports = router;
