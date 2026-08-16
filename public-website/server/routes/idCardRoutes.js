const express = require('express');
const { generateIdCard } = require('../controllers/idCardController');
const { lookupLimiter } = require('../middleware/rateLimit');
const router = express.Router();
router.get('/:identifier', lookupLimiter, generateIdCard);
module.exports = router;
