const express = require('express');
const { login, logout, getMe, updateMe, refresh } = require('../controllers/authController');
const { verifyTrainerCnic, resetTrainerPasswordByCnic } = require('../controllers/trainerPasswordController');
const { protect } = require('../middleware/authMiddleware');
const { authLimiter, publicWriteLimiter } = require('../middleware/rateLimit');

const router = express.Router();

router.post('/login', authLimiter, login);
// Trainer self-service "forgot password" — verified by CNIC (+ phone to
// actually reset), not self-registration. A trainer never creates their own
// profile; Super Admin/Sub-Admin's "+ Add Trainer" does that and mints the
// first password (see trainerCreateController.createTrainer) — this is only
// for recovering access to that same account.
router.post('/trainer/verify-cnic', publicWriteLimiter, verifyTrainerCnic);
router.post('/trainer/reset-password', publicWriteLimiter, resetTrainerPasswordByCnic);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.patch('/me', protect, updateMe);

module.exports = router;
