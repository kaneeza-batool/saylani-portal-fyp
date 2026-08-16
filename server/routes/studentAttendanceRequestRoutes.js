const express = require('express');
const { getRequests, resolveRequest } = require('../controllers/studentAttendanceRequestController');
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');

const router = express.Router();

// Creation happens from the Student Portal's own backend, straight against
// the shared collection — this router only ever lists/resolves.
router.use(protect, restrictTo('super_admin', 'sub_admin'));

router.get('/', getRequests);
router.patch('/:id', resolveRequest);

module.exports = router;
