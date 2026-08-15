const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { getProfile, updateProfile, uploadAvatar, skipOnboarding } = require('../controllers/studentController');

const router = express.Router();

router.use(protect);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/avatar', uploadAvatar);
router.post('/onboarding/skip', skipOnboarding);

module.exports = router;
