const express = require('express');
const { getMyBatches } = require('../controllers/trainerDashboardController');
const { listCourses, listMyQuizzes, createQuiz } = require('../controllers/trainerQuizController');
const {
  createAssignment,
  listMyAssignments,
  getAssignmentRoster,
  listSubmissionsForReview,
  listReviewedSubmissions,
  reviewSubmission,
  getPendingReviewCount,
} = require('../controllers/trainerAssignmentController');
const { listMyStudents, setStudentGrade } = require('../controllers/trainerStudentsController');
const { getRosterForDate, markAttendance } = require('../controllers/trainerStudentAttendanceController');
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect, restrictTo('trainer'));

router.get('/dashboard', getMyBatches);
router.get('/students', listMyStudents);
router.get('/courses', listCourses);
router.get('/quizzes', listMyQuizzes);
router.post('/quizzes', createQuiz);
router.get('/assignments', listMyAssignments);
router.post('/assignments', createAssignment);
router.get('/assignments/:id/roster', getAssignmentRoster);
router.get('/submissions/pending', listSubmissionsForReview);
router.get('/submissions/reviewed', listReviewedSubmissions);
router.get('/submissions/pending-count', getPendingReviewCount);
router.patch('/submissions/:id/review', reviewSubmission);
router.patch('/students/:studentId/grade', setStudentGrade);
router.get('/attendance', getRosterForDate);
router.post('/attendance', markAttendance);

module.exports = router;
