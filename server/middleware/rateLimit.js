const rateLimit = require('express-rate-limit');

// Max 5 attempts per IP per 15 minutes — counts both failed and successful
// attempts, same shape as public-website's adminAuthRoutes limiter. A
// legitimate user logging in 6 times in 15 minutes is rare enough that
// erring toward blocking brute-force wins.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Please try again in 15 minutes.' },
});

// Looser cap for public form submissions (job applications, donations) —
// these are legitimate one-off actions, not repeated auth attempts, so the
// limit only needs to stop scripted spam rather than a slow human retrying.
const publicWriteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many submissions from this network. Please try again in 15 minutes.' },
});

module.exports = { authLimiter, publicWriteLimiter };
