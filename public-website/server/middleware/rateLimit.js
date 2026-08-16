const rateLimit = require('express-rate-limit');

// Looser than adminAuthRoutes' loginLimiter (5/15min) — this guards public
// form submissions (admission applications, contact messages), not repeated
// auth attempts, so it only needs to stop scripted spam rather than a slow
// human retrying a typo'd form.
const publicWriteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many submissions from this network. Please try again in 15 minutes.' },
});

// Chat needs a much higher ceiling than a one-off form submission — a
// single real conversation can easily run 15-20 messages back and forth.
// Still capped since each request is a real (paid) OpenAI API call.
const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many messages from this network. Please try again in 15 minutes.' },
});

module.exports = { publicWriteLimiter, chatLimiter };
