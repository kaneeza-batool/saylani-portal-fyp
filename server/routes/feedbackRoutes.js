const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { submitFeedback } = require('../controllers/feedbackController');

const router = express.Router();

router.use(protect);

router.post('/', submitFeedback);

module.exports = router;
