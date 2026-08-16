const express = require('express');
const { getRequests, createRequest, resolveRequest } = require('../controllers/attendanceRequestController');
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');

const router = express.Router();

// super_admin: sees/resolves every campus. sub_admin: campus-scoped
// list + resolve. trainer: self-service create + list of their own
// requests only — enforced inside the controller, not here, since who can
// do what differs per action rather than per role uniformly.
router.use(protect, restrictTo('super_admin', 'sub_admin', 'trainer'));

router.get('/', getRequests);
router.post('/', createRequest);
router.patch('/:id', resolveRequest);

module.exports = router;
