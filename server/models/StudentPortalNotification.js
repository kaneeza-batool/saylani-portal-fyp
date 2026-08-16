const mongoose = require('mongoose');

// Mirror of student-portal's Notification (see student-portal/server/models/
// Notification.js) — this app creates a notification when a Super Admin or
// Sub-Admin responds to a student's feedback (see studentFeedbackController.
// respondToFeedback); student-portal is what actually reads/displays them
// (NotificationBell.jsx, NotificationsPage.jsx). Explicit collection name
// matching the real model exactly, same mirror pattern as
// StudentPortalSupportFeedback/StudentPortalQuiz/StudentPortalAssignment.
const notificationSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    icon: { type: String, default: '' },
    title: { type: String, required: true, trim: true },
    message: { type: String, trim: true, default: '' },
    isRead: { type: Boolean, default: false },
    isDismissed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('StudentPortalNotification', notificationSchema, 'notifications');
