const express = require('express');
const { protectAny } = require('../middleware/authMiddleware');
const { getProfile, updateProfile, uploadAvatar, skipOnboarding } = require('../controllers/studentController');

const router = express.Router();

// protectAny — profile setup and onboarding (avatar, skip) are exactly
// the actions a pending applicant should be able to finish while they
// wait on admission approval, unlike every other route in this app.
router.use(protectAny);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/avatar', uploadAvatar);
router.post('/onboarding/skip', skipOnboarding);

module.exports = router;
