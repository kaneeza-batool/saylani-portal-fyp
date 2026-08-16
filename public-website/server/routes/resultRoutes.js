const express = require('express');
const { checkResult } = require('../controllers/resultController');
const { lookupLimiter } = require('../middleware/rateLimit');
const router = express.Router();
router.get('/:identifier', lookupLimiter, checkResult);
module.exports = router;
