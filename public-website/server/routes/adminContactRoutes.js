const express = require('express');
const requireAdminAuth = require('../middleware/adminAuth');
const { listSubmissions, deleteSubmission } = require('../controllers/adminContactController');

const router = express.Router();

router.use(requireAdminAuth);

router.get('/', listSubmissions);
router.delete('/:id', deleteSubmission);

module.exports = router;
