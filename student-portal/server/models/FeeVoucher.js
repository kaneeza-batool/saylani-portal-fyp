const mongoose = require('mongoose');

const feeVoucherSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    month: { type: String, required: true, trim: true }, // e.g. "Jun 2026"
    amount: { type: Number, required: true },
    type: { type: String, required: true, trim: true, default: 'Monthly' },
    dueDate: { type: Date, required: true },
    voucherId: { type: String, required: true, unique: true, trim: true },
    status: { type: String, enum: ['paid', 'pending'], default: 'pending' },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('FeeVoucher', feeVoucherSchema);
