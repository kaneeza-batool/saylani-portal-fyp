const express = require('express');
const requireAdminAuth = require('../middleware/adminAuth');
const upload = require('../middleware/upload');
const {
  listCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  uploadCourseImage,
} = require('../controllers/adminCourseController');

const router = express.Router();

router.use(requireAdminAuth);

router.get('/', listCourses);
router.post('/', createCourse);
router.get('/:id', getCourse);
router.put('/:id', updateCourse);
router.delete('/:id', deleteCourse);
router.post('/:id/image', upload.single('image'), uploadCourseImage);

module.exports = router;
