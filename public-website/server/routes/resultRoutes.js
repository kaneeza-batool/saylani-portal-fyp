const express = require('express');
const { checkResult } = require('../controllers/resultController');
const router = express.Router();
router.get('/:identifier', checkResult);
module.exports = router;
