const express = require('express');
const { getSubAdmins, createSubAdmin, updateSubAdmin, deleteSubAdmin } = require('../controllers/subAdminController');
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect, restrictTo('super_admin'));

router.get('/', getSubAdmins);
router.post('/', createSubAdmin);
router.patch('/:id', updateSubAdmin);
router.delete('/:id', deleteSubAdmin);

module.exports = router;
