const express = require('express');
const { getFeedback } = require('../controllers/feedbackController');
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');
const { campusScope } = require('../middleware/campusScope');
const { checkPermission } = require('../middleware/checkPermission');

const router = express.Router();

router.get(
  '/',
  protect,
  restrictTo('super_admin', 'sub_admin'),
  campusScope,
  checkPermission('FEEDBACK', 'read'),
  getFeedback
);

module.exports = router;
