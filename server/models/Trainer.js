const mongoose = require('mongoose');

// Kept as a standalone record (not tied to a User login) — this is a CRUD
// page for trainer profiles, not the trainer-facing auth/attendance flows
// from the screenshots, which are separate, unbuilt features.
const trainerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, default: '', trim: true },
    employeeId: { type: String, required: true, unique: true, trim: true },
    course: { type: String, default: '', trim: true },
    city: { type: String, default: '', trim: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Trainer', trainerSchema);
