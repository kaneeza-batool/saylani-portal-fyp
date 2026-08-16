const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');
const {
  getMyEmployerProfile,
  listMyJobs,
  createMyJob,
  updateMyJob,
  listMyJobApplications,
  updateMyJobApplicationStatus,
} = require('../controllers/employerPortalController');

const router = express.Router();

router.use(protect, restrictTo('employer'));

router.get('/profile', getMyEmployerProfile);
router.get('/jobs', listMyJobs);
router.post('/jobs', createMyJob);
router.patch('/jobs/:id', updateMyJob);
router.get('/applications', listMyJobApplications);
router.patch('/applications/:id/status', updateMyJobApplicationStatus);

module.exports = router;
