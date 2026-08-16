const mongoose = require('mongoose');

// Login credentials live on User{role:'employer'}, not here — same split as
// Trainer.js/Trainer records: this is the company profile, User owns auth.
// A self-registered employer (authController.registerEmployer) creates both,
// joined by email, exactly like registerTrainer already does for User+Trainer.
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
