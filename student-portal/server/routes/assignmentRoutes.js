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

router.get('/', getAssignments);
router.get('/summary', getSummaryStats);
router.get('/:id', getAssignmentDetail);
router.post('/:id/submit', submitAssignment);

module.exports = router;
