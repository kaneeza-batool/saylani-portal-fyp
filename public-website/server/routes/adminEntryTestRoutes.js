const express = require('express');
const requireAdminAuth = require('../middleware/adminAuth');
const {
  listApplicants,
  getApplicant,
  createApplicant,
  updateApplicant,
  deleteApplicant,
} = require('../controllers/adminEntryTestController');

const router = express.Router();

router.use(requireAdminAuth);

router.get('/', listApplicants);
router.post('/', createApplicant);
router.get('/:id', getApplicant);
router.put('/:id', updateApplicant);
router.delete('/:id', deleteApplicant);

module.exports = router;
