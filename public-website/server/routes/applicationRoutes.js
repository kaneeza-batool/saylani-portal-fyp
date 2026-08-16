const express = require('express');
const { submitApplication } = require('../controllers/applicationController');
const { publicWriteLimiter } = require('../middleware/rateLimit');
const { applicationUpload } = require('../middleware/upload');

const router = express.Router();

router.post(
  '/',
  publicWriteLimiter,
  applicationUpload.fields([{ name: 'photo', maxCount: 1 }, { name: 'cnicScan', maxCount: 1 }]),
  submitApplication
);

module.exports = router;
