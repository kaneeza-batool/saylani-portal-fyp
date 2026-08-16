const express = require('express');
const { login, logout, getMe, updateMe, registerTrainer, refresh } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { authLimiter, publicWriteLimiter } = require('../middleware/rateLimit');

const router = express.Router();

router.post('/login', authLimiter, login);
router.post('/register-trainer', publicWriteLimiter, registerTrainer);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.patch('/me', protect, updateMe);

module.exports = router;
