const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { submitFeedback, getMyFeedback } = require('../controllers/feedbackController');

const router = express.Router();

router.use(protect);

router.post('/', submitFeedback);
router.get('/mine', getMyFeedback);

module.exports = router;
