const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { submitFeedback, getMyFeedback } = require('../controllers/supportFeedbackController');

const router = express.Router();

router.use(protect);

router.post('/', submitFeedback);
router.get('/mine', getMyFeedback);

module.exports = router;
