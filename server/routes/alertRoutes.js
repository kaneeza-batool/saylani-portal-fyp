const express = require('express');
const { getAlerts, resolveAlert } = require('../controllers/alertController');
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect, restrictTo('super_admin'));

router.get('/', getAlerts);
router.patch('/:id/resolve', resolveAlert);

module.exports = router;
