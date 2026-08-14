const express = require('express');
const upload = require('../utils/upload');
const { listPublicJobs, getPublicJob, submitApplication, checkApplicationStatus } = require('../controllers/publicJobController');

const router = express.Router();

router.get('/jobs', listPublicJobs);
router.get('/jobs/:id', getPublicJob);
router.post('/jobs/:id/apply', upload.fields([{ name: 'resume', maxCount: 1 }, { name: 'photo', maxCount: 1 }]), submitApplication);
router.post('/applications/status', checkApplicationStatus);

module.exports = router;
