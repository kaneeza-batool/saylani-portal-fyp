const mongoose = require('mongoose');

const employerSchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true, unique: true, trim: true },
    contactEmail: { type: String, required: true, trim: true, lowercase: true },
    contactPhone: { type: String, default: '', trim: true },
    city: { type: String, default: '', trim: true },
    status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Employer', employerSchema);
