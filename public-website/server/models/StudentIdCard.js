const mongoose = require('mongoose');

const studentIdCardSchema = new mongoose.Schema(
  {
    application: { type: mongoose.Schema.Types.ObjectId, ref: 'Application' },
    fullName: { type: String, required: true, trim: true },
    cnic: {
      type: String,
      required: true,
      trim: true,
      match: [/^\d{13}$/, 'CNIC must be 13 digits'],
    },
    referenceNumber: { type: String, trim: true, default: '' },
    program: { type: String, required: true, trim: true },
    batch: { type: String, trim: true, default: '' },
    campus: { type: String, required: true, trim: true },
    cardId: { type: String, required: true, unique: true, trim: true },
    issueDate: { type: Date, default: Date.now },
    validUntil: { type: Date, required: true },
    status: { type: String, enum: ['active', 'expired'], default: 'active' },
  },
  { timestamps: true }
);

studentIdCardSchema.index({ cnic: 1 });

module.exports = mongoose.model('StudentIdCard', studentIdCardSchema);
