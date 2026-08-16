const express = require('express');
const { chat } = require('../controllers/chatController');
const { chatLimiter } = require('../middleware/rateLimit');

const router = express.Router();

// Higher ceiling than a one-off form submission (see chatLimiter) — a
// single real conversation can easily run 15-20 messages, and the
// stricter publicWriteLimiter would cut that off mid-conversation. Still
// capped since each request is a real (paid) OpenAI API call.
router.post('/', chatLimiter, chat);

module.exports = router;
