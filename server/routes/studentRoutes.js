const express = require('express');
const {
  getStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
} = require('../controllers/studentController');
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');
const { campusScope } = require('../middleware/campusScope');
const { checkPermission } = require('../middleware/checkPermission');

const router = express.Router();

router.use(protect);

router.get(
  '/',
  restrictTo('super_admin', 'sub_admin'),
  campusScope,
  checkPermission('STUDENT', 'read'),
  getStudents
);
router.get('/:id', restrictTo('super_admin'), getStudent);
router.post('/', restrictTo('super_admin'), createStudent);
router.patch(
  '/:id',
  restrictTo('super_admin', 'sub_admin'),
  campusScope,
  checkPermission('STUDENT', 'update'),
  updateStudent
);
router.delete('/:id', restrictTo('super_admin'), deleteStudent);

module.exports = router;
