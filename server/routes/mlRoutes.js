const express = require('express');
const { getDropoutRisk } = require('../controllers/mlController');
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');

const router = express.Router();

router.get('/dropout-risk', protect, restrictTo('super_admin'), getDropoutRisk);

module.exports = router;
