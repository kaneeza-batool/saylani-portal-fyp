const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { createRequest, getMyRequests, selfMarkPresent } = require('../controllers/attendanceRequestController');

const router = express.Router();

router.use(protect);

router.get('/', getMyRequests);
router.post('/', createRequest);
router.post('/self-mark', selfMarkPresent);

module.exports = router;
