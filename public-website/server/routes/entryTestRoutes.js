const express = require('express');
const { checkEntryTestStatus } = require('../controllers/entryTestController');
const router = express.Router();
router.get('/:identifier', checkEntryTestStatus);
module.exports = router;
