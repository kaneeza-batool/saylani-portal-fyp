const Alert = require('../models/Alert');

exports.getAlerts = async (req, res) => {
  try {
    const { status = 'active' } = req.query;
    const filter = status === 'all' ? {} : { status };
    const alerts = await Alert.find(filter).sort({ createdAt: -1 }).limit(100);
    return res.status(200).json({ items: alerts, total: alerts.length });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load alerts', error: err.message });
  }
};

exports.resolveAlert = async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(req.params.id, { status: 'resolved' }, { new: true });
    if (!alert) return res.status(404).json({ message: 'Alert not found' });
    return res.status(200).json({ item: alert });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to resolve alert', error: err.message });
  }
};
