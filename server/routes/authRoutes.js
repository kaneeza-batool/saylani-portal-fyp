const express = require('express');
const { login, logout, getMe, updateMe, registerTrainer } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/login', login);
router.post('/register-trainer', registerTrainer);
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.patch('/me', protect, updateMe);

module.exports = router;
