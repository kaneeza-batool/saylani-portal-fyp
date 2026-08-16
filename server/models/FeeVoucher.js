const mongoose = require('mongoose');

// Mirrors student-portal/server/models/FeeVoucher.js exactly (same field
// shapes, same model name) so both apps' mongoose instances resolve to the
// same underlying `feevouchers` collection in the shared titan-portal
// database (see Student.js's shared-data migration notes) — no cross-service
// API calls needed for the admin side to read/write vouchers the student
// portal already seeds and displays.
const feeVoucherSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    month: { type: String, required: true, trim: true }, // e.g. "Jun 2026"
    amount: { type: Number, required: true },
    type: { type: String, required: true, trim: true, default: 'Monthly' },
    dueDate: { type: Date, required: true },
    voucherId: { type: String, required: true, unique: true, trim: true },
    // No 'overdue' value — overdue is derived (status: 'pending' AND dueDate
    // in the past), computed wherever it's needed rather than stored.
    status: { type: String, enum: ['paid', 'pending'], default: 'pending' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('FeeVoucher', feeVoucherSchema);
