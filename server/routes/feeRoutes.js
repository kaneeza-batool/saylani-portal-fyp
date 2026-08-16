const express = require('express');
const { getFees, updateFee, generateFee, bulkGenerateFees } = require('../controllers/feeController');
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');
const { campusScope } = require('../middleware/campusScope');
const { checkPermission } = require('../middleware/checkPermission');

const router = express.Router();

router.use(protect, restrictTo('super_admin', 'sub_admin'), campusScope);

router.get('/', checkPermission('FEES', 'read'), getFees);
router.patch('/:id', checkPermission('FEES', 'update'), updateFee);
router.post('/generate-bulk', checkPermission('FEES', 'update'), bulkGenerateFees);
router.post('/generate/:studentId', checkPermission('FEES', 'update'), generateFee);

module.exports = router;
