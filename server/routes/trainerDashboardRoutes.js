const express = require('express');
const { getMyBatches } = require('../controllers/trainerDashboardController');
const { listCourses, listMyQuizzes, createQuiz } = require('../controllers/trainerQuizController');
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect, restrictTo('trainer'));

router.get('/dashboard', getMyBatches);
router.get('/courses', listCourses);
router.get('/quizzes', listMyQuizzes);
router.post('/quizzes', createQuiz);

module.exports = router;
