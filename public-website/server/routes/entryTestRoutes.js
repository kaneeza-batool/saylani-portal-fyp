const express = require('express');
const { checkEntryTestStatus } = require('../controllers/entryTestController');
const { lookupLimiter } = require('../middleware/rateLimit');
const router = express.Router();
router.get('/:identifier', lookupLimiter, checkEntryTestStatus);
module.exports = router;
