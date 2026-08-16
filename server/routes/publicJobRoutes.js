const express = require('express');
const upload = require('../utils/upload');
const { listPublicJobs, getPublicJob, submitApplication, checkApplicationStatus } = require('../controllers/publicJobController');
const { publicWriteLimiter } = require('../middleware/rateLimit');

const router = express.Router();

router.get('/jobs', listPublicJobs);
router.get('/jobs/:id', getPublicJob);
router.post(
  '/jobs/:id/apply',
  publicWriteLimiter,
  upload.fields([{ name: 'resume', maxCount: 1 }, { name: 'photo', maxCount: 1 }]),
  submitApplication
);
router.post('/applications/status', publicWriteLimiter, checkApplicationStatus);

module.exports = router;
