const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  getAssignments,
  getAssignmentDetail,
  submitAssignment,
  getSummaryStats,
} = require('../controllers/assignmentController');

const router = express.Router();

router.use(protect);

router.get('/:courseId', getAssignments);
router.get('/:courseId/summary', getSummaryStats);
router.get('/:courseId/:id', getAssignmentDetail);
router.post('/:courseId/:id/submit', submitAssignment);

module.exports = router;
