const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  getQuizzes,
  getQuizForTaking,
  startAttempt,
  submitAttempt,
  getAttemptResult,
} = require('../controllers/quizController');

const router = express.Router();

router.use(protect);

router.get('/result/:attemptId', getAttemptResult);
router.get('/', getQuizzes);
router.get('/:id/take', getQuizForTaking);
router.post('/:id/start', startAttempt);
router.post('/:id/submit', submitAttempt);

module.exports = router;
