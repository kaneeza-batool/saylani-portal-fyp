const express = require('express');
const { generateIdCard } = require('../controllers/idCardController');
const router = express.Router();
router.get('/:identifier', generateIdCard);
module.exports = router;
