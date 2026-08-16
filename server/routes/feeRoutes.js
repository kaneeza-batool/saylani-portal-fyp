const express = require('express');
const { getFees, updateFee } = require('../controllers/feeController');
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');
const { campusScope } = require('../middleware/campusScope');
const { checkPermission } = require('../middleware/checkPermission');

const router = express.Router();

router.use(protect, restrictTo('super_admin', 'sub_admin'), campusScope);

router.get('/', checkPermission('FEES', 'read'), getFees);
router.patch('/:id', checkPermission('FEES', 'update'), updateFee);

module.exports = router;
