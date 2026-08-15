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
router.get('/:courseId', getQuizzes);
router.get('/:courseId/:id/take', getQuizForTaking);
router.post('/:courseId/:id/start', startAttempt);
router.post('/:courseId/:id/submit', submitAttempt);

module.exports = router;
