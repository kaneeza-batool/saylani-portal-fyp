const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { getSkillPassport } = require('../controllers/skillPassportController');

const router = express.Router();

router.use(protect);

router.get('/', getSkillPassport);

module.exports = router;
