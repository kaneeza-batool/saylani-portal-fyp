const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  getQuestions,
  createQuestion,
  getQuestionDetail,
  createAnswer,
  upvoteQuestion,
  upvoteAnswer,
  markAcceptedAnswer,
} = require('../controllers/questionController');

const router = express.Router();

router.use(protect);

router.get('/course/:courseId', getQuestions);
router.post('/course/:courseId', createQuestion);
router.get('/:questionId', getQuestionDetail);
router.post('/:questionId/answers', createAnswer);
router.patch('/:questionId/upvote', upvoteQuestion);
router.patch('/answers/:answerId/upvote', upvoteAnswer);
router.patch('/answers/:answerId/accept', markAcceptedAnswer);

module.exports = router;
