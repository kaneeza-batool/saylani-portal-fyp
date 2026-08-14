const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { getMyWeekAgenda } = require('../controllers/agendaController');

const router = express.Router();

router.use(protect);

router.get('/', getMyWeekAgenda);

module.exports = router;
