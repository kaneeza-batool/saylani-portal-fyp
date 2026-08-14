const express = require('express');
const { listPublicCourses, getCourseBySlug } = require('../controllers/courseController');

const router = express.Router();

router.get('/', listPublicCourses);
router.get('/:slug', getCourseBySlug);

module.exports = router;
