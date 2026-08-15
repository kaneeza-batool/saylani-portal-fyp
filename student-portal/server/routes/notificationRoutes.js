const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  getNotifications,
  getAllNotifications,
  markAsRead,
  dismissNotification,
} = require('../controllers/notificationController');

const router = express.Router();

router.use(protect);

router.get('/', getNotifications);
router.get('/all', getAllNotifications);
router.patch('/:id/read', markAsRead);
router.patch('/:id/dismiss', dismissNotification);

module.exports = router;
