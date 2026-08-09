const FeeVoucher = require('../models/FeeVoucher');

exports.getFeeHistory = async (req, res) => {
  try {
    const { courseId } = req.params;
    const vouchers = await FeeVoucher.find({ student: req.student._id, courseId }).sort({ dueDate: -1 });
    return res.status(200).json({ vouchers });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load fee history', error: err.message });
  }
};

exports.getFeeSummary = async (req, res) => {
  try {
    const { courseId } = req.params;
    const vouchers = await FeeVoucher.find({ student: req.student._id, courseId });
    const totalPaid = vouchers.filter((v) => v.status === 'paid').reduce((sum, v) => sum + v.amount, 0);
    const pendingCount = vouchers.filter((v) => v.status === 'pending').length;

    return res.status(200).json({ totalPaid, pendingCount });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load fee summary', error: err.message });
  }
};
