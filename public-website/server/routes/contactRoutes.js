const express = require('express');
const { submitContact } = require('../controllers/contactController');
const { publicWriteLimiter } = require('../middleware/rateLimit');

const router = express.Router();

router.post('/', publicWriteLimiter, submitContact);

module.exports = router;
