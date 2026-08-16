const express = require('express');
const requireAdminAuth = require('../middleware/adminAuth');
const { listCards, getCard, createCard, updateCard, deleteCard } = require('../controllers/adminIdCardController');

const router = express.Router();

router.use(requireAdminAuth);

router.get('/', listCards);
router.post('/', createCard);
router.get('/:id', getCard);
router.put('/:id', updateCard);
router.delete('/:id', deleteCard);

module.exports = router;
