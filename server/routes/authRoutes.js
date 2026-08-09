const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { login, logout, getMe, verifyCnic, setPassword } = require('../controllers/authController');

const router = express.Router();

router.post('/login', login);
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.post('/verify-cnic', verifyCnic);
router.post('/set-password', setPassword);

module.exports = router;
