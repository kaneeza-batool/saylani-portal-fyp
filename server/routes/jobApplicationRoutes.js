const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');
const {
  getApplications,
  getApplication,
  updateApplicationStatus,
  deleteApplication,
  getJobOptions,
} = require('../controllers/jobApplicationController');

const router = express.Router();
router.use(protect, restrictTo('super_admin'));

router.get('/jobs-options', getJobOptions);
router.get('/', getApplications);
router.get('/:id', getApplication);
router.patch('/:id/status', updateApplicationStatus);
router.delete('/:id', deleteApplication);

module.exports = router;
