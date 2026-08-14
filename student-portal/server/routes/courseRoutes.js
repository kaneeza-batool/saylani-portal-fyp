const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { getEnrolledCourses } = require('../controllers/courseController');

const router = express.Router();

router.use(protect);

router.get('/', getEnrolledCourses);

module.exports = router;
