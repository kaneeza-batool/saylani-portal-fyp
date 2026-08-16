const express = require('express');
const requireAdminAuth = require('../middleware/adminAuth');
const { listResults, getResult, createResult, updateResult, deleteResult } = require('../controllers/adminResultController');

const router = express.Router();

router.use(requireAdminAuth);

router.get('/', listResults);
router.post('/', createResult);
router.get('/:id', getResult);
router.put('/:id', updateResult);
router.delete('/:id', deleteResult);

module.exports = router;
