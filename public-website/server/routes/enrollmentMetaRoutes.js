const express = require('express');
const { getCampuses, getCourseOptions } = require('../controllers/enrollmentMetaController');

const router = express.Router();

router.get('/campuses', getCampuses);
router.get('/course-options', getCourseOptions);

module.exports = router;
