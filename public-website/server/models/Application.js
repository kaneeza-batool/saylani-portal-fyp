const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    fatherName: { type: String, required: true, trim: true },
    cnic: {
      type: String,
      required: true,
      trim: true,
      match: [/^\d{13}$/, 'CNIC must be 13 digits'],
    },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    address: { type: String, required: true, trim: true },
    dateOfBirth: { type: Date, required: true },
    gender: { type: String, enum: ['male', 'female', 'other'], required: true },
    lastQualification: { type: String, required: true, trim: true },
    selectedProgram: { type: String, required: true, trim: true },
    preferredBatch: { type: String, trim: true, default: '' },
    hasLaptop: { type: Boolean, default: false },
    // Optional — the application form doesn't require these, so most
    // applications won't have either set. Relative paths served from
    // /uploads/applications (see middleware/upload.js's applicationUpload).
    photoUrl: { type: String, default: '' },
    cnicScanUrl: { type: String, default: '' },
    referenceNumber: { type: String, required: true, unique: true },
    // No Sub-Admin portal is wired up yet to review these, so every
    // application just sits at 'pending' forever. Once that admission
    // queue exists, it owns transitioning this to reviewing/accepted/rejected.
    status: { type: String, enum: ['pending', 'reviewing', 'accepted', 'rejected'], default: 'pending' },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Application', applicationSchema);
