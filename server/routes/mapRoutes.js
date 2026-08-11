const express = require('express');
const { getCampusMap } = require('../controllers/mapController');
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');

const router = express.Router();

router.get('/campuses', protect, restrictTo('super_admin'), getCampusMap);

module.exports = router;
