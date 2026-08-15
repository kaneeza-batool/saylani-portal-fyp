const mongoose = require('mongoose');

// Columns/fields trimmed from the "Add new slot" screenshot to what a slot
// actually needs to be scheduled and filled — the raw screenshot had ~14
// fields (online, cert type, hourly rate, whatsapp link, capacity slider...);
// kept the ones that drive the list/table and the mark-attendance flow,
// dropped the rest as decorative for a v1.
const slotSchema = new mongoose.Schema(
  {
    schedule: { type: String, required: true, trim: true }, // e.g. "Sat 11:00 AM - 01:00 PM | Wed 11:00 AM - 01:00 PM"
    trainer: { type: String, required: true, trim: true },
    // Real login-linked reference, additive alongside `trainer` above
    // (kept as-is — display name, still shown everywhere it already is).
    // Not required: existing slots and any created without picking a
    // trainer User account stay valid; only slots created/edited from the
    // Trainer Portal side (or explicitly assigned by an admin) populate
    // this. Trainer Portal's dashboard ("My Batches") is the only reader —
    // see trainerDashboardController.js.
    assignedTrainer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    course: { type: String, required: true, trim: true },
    campus: { type: mongoose.Schema.Types.ObjectId, ref: 'Campus', required: true, index: true },
    seatsTotal: { type: Number, required: true, min: 1 },
    seatsFilled: { type: Number, default: 0, min: 0 },
    gender: { type: String, enum: ['Male', 'Female', 'Mixed'], default: 'Mixed' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Slot', slotSchema);
