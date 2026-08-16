const express = require('express');
const { getMyBatches } = require('../controllers/trainerDashboardController');
const { listCourses, listMyQuizzes, createQuiz } = require('../controllers/trainerQuizController');
const {
  createAssignment,
  listMyAssignments,
  listSubmissionsForReview,
  listReviewedSubmissions,
  reviewSubmission,
  getPendingReviewCount,
} = require('../controllers/trainerAssignmentController');
const { listMyStudents, setStudentGrade } = require('../controllers/trainerStudentsController');
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect, restrictTo('trainer'));

router.get('/dashboard', getMyBatches);
router.get('/courses', listCourses);
router.get('/quizzes', listMyQuizzes);
router.post('/quizzes', createQuiz);
router.get('/assignments', listMyAssignments);
router.post('/assignments', createAssignment);
router.get('/submissions/pending', listSubmissionsForReview);
router.get('/submissions/reviewed', listReviewedSubmissions);
router.get('/submissions/pending-count', getPendingReviewCount);
router.patch('/submissions/:id/review', reviewSubmission);
router.get('/students', listMyStudents);
router.patch('/students/:studentId/grade', setStudentGrade);

module.exports = router;
