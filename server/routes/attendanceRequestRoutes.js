const express = require('express');
const { getRequests, createRequest, resolveRequest } = require('../controllers/attendanceRequestController');
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect, restrictTo('super_admin'));

router.get('/', getRequests);
router.post('/', createRequest);
router.patch('/:id', resolveRequest);

module.exports = router;
