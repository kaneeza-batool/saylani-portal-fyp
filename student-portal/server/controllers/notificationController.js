const Notification = require('../models/Notification');

exports.getNotifications = async (req, res) => {
  try {
    // $ne (not $eq false): notifications seeded before isDismissed existed
    // on the schema were never persisted with the field at all, so an
    // equality match against `false` would silently exclude them.
    const notifications = await Notification.find({ student: req.student._id, isDismissed: { $ne: true } }).sort({
      createdAt: -1,
    });
    const unreadCount = notifications.filter((n) => !n.isRead).length;
    return res.status(200).json({ notifications, unreadCount });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load notifications', error: err.message });
  }
};

// Full history — includes read AND previously-dismissed notifications, so
// dismissing from the dropdown only hides, it never deletes.
exports.getAllNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ student: req.student._id }).sort({ createdAt: -1 });
    return res.status(200).json({ notifications });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load notification history', error: err.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({ _id: req.params.id, student: req.student._id });
    if (!notification) return res.status(404).json({ message: 'Notification not found' });

    notification.isRead = true;
    await notification.save();

    return res.status(200).json({ notification });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update notification', error: err.message });
  }
};

exports.dismissNotification = async (req, res) => {
  try {
    const notification = await Notification.findOne({ _id: req.params.id, student: req.student._id });
    if (!notification) return res.status(404).json({ message: 'Notification not found' });

    notification.isDismissed = true;
    await notification.save();

    return res.status(200).json({ notification });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update notification', error: err.message });
  }
};
