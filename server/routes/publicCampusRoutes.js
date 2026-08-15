const express = require('express');
const { listPublicCampuses } = require('../controllers/publicCampusController');

const router = express.Router();

router.get('/', listPublicCampuses);

module.exports = router;
