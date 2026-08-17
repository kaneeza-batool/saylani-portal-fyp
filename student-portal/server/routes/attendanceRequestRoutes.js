const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { createRequest, getMyRequests } = require('../controllers/attendanceRequestController');

const router = express.Router();

router.use(protect);

router.get('/', getMyRequests);
router.post('/', createRequest);

module.exports = router;
