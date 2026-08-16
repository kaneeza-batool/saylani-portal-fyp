const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { chat } = require('../controllers/chatController');

const router = express.Router();

router.use(protect);

router.post('/', chat);

module.exports = router;
