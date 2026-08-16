const express = require('express');
const { protectAny } = require('../middleware/authMiddleware');
const {
  login,
  logout,
  getMe,
  refresh,
  verifyCnic,
  setPassword,
  forgotPassword,
  resetPassword,
} = require('../controllers/authController');

const router = express.Router();

router.post('/login', login);
router.post('/logout', logout);
// protectAny, not protect — a pending student still needs getMe to work
// (it's what AuthContext calls on every page load) so they don't look
// logged out while waiting on their onboarding/pending-approval screen.
router.get('/me', protectAny, getMe);
// No `protect` here — this is exactly the endpoint used when the access
// token has expired, so it authenticates off the refresh token cookie
// directly instead.
router.post('/refresh', refresh);
router.post('/verify-cnic', verifyCnic);
router.post('/set-password', setPassword);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

module.exports = router;
