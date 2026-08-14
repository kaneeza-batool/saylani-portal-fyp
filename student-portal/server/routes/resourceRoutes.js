const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { getResourceLibrary } = require('../controllers/resourceController');

const router = express.Router();

router.use(protect);

router.get('/:courseId', getResourceLibrary);

module.exports = router;
