const express = require('express');
const { getAdmissions, approveAdmission, rejectAdmission } = require('../controllers/admissionController');
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');
const { campusScope } = require('../middleware/campusScope');
const { checkPermission } = require('../middleware/checkPermission');

const router = express.Router();

router.use(protect, restrictTo('super_admin', 'sub_admin'), campusScope);

router.get('/', checkPermission('ADMISSIONS', 'read'), getAdmissions);
router.patch('/:id/approve', checkPermission('ADMISSIONS', 'update'), approveAdmission);
router.patch('/:id/reject', checkPermission('ADMISSIONS', 'update'), rejectAdmission);

module.exports = router;
