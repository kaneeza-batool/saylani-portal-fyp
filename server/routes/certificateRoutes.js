const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  getEligibleCertificates,
  getCertificateForCourse,
  getCertificate,
  verifyCertificate,
} = require('../controllers/certificateController');

const router = express.Router();

// PUBLIC — registered before router.use(protect) below, so requests here
// never hit the auth check. Anyone with a certificate link (e.g. an
// employer) needs to be able to verify it without logging in.
router.get('/verify/:certificateId', verifyCertificate);

router.use(protect);

router.get('/eligible', getEligibleCertificates);
router.get('/course/:courseId', getCertificateForCourse);
router.get('/:certificateId', getCertificate);

module.exports = router;
