const express = require('express');
const { getFeedback, respondToFeedback } = require('../controllers/studentFeedbackController');
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');

const router = express.Router();

// Creation happens from the Student Portal's own backend, straight against
// the shared collection — this router only ever lists/responds.
router.use(protect, restrictTo('super_admin', 'sub_admin'));

router.get('/', getFeedback);
router.patch('/:id', respondToFeedback);

module.exports = router;
