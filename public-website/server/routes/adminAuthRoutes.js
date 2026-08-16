const express = require('express');
const rateLimit = require('express-rate-limit');
const { login, logout, me } = require('../controllers/adminAuthController');
const requireAdminAuth = require('../middleware/adminAuth');

const router = express.Router();

// Max 5 login attempts per IP per 15 minutes — counts both failed and
// successful attempts (a legitimate admin logging in 6 times in 15
// minutes is rare enough that erring toward blocking brute-force wins).
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Please try again in 15 minutes.' },
});

router.post('/login', loginLimiter, login);
router.post('/logout', logout);
router.get('/me', requireAdminAuth, me);

module.exports = router;
