const express = require('express');
const { getMyBatches, getMyAttendance } = require('../controllers/trainerDashboardController');
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
const {
  listMyAttendanceCourses,
  getRosterForDate,
  markAttendance,
  markByRollNumber,
} = require('../controllers/trainerStudentAttendanceController');
const { uploadResource, listMyResources, deleteResource } = require('../controllers/trainerResourceController');
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');
const { resourceUpload } = require('../utils/upload');

const router = express.Router();

router.use(protect, restrictTo('trainer'));

router.get('/dashboard', getMyBatches);
router.get('/my-attendance', getMyAttendance);
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
router.get('/attendance/courses', listMyAttendanceCourses);
router.get('/attendance', getRosterForDate);
router.post('/attendance', markAttendance);
router.post('/attendance/scan', markByRollNumber);
router.get('/resources', listMyResources);
router.post('/resources', resourceUpload.single('file'), uploadResource);
router.delete('/resources/:id', deleteResource);

module.exports = router;
