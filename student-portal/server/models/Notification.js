const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    icon: { type: String, default: '' }, // emoji, matching the app's existing icon-free notification style (Toast, streak toast)
    title: { type: String, required: true, trim: true },
    message: { type: String, trim: true, default: '' },
    // In-app route to navigate to on click (e.g. "/feedback") — empty means
    // the notification is informational only, nothing to jump to.
    link: { type: String, default: '' },
    isRead: { type: Boolean, default: false },
    // Dismissed = hidden from the bell dropdown but still visible on the
    // full /notifications history page, so nothing is truly lost.
    isDismissed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ student: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
