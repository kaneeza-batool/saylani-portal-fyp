const mongoose = require('mongoose');

const trainerAttendanceSchema = new mongoose.Schema(
  {
    trainer: { type: mongoose.Schema.Types.ObjectId, ref: 'Trainer', required: true },
    trainerName: { type: String, required: true }, // cached for display without a populate
    employeeId: { type: String, required: true },
    campus: { type: String, default: '' },
    schedule: { type: String, default: '' },
    date: { type: Date, required: true, default: () => new Date(new Date().toDateString()) },
    checkIn: { type: Date, default: null },
    checkOut: { type: Date, default: null },
    lateMinutes: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Same duplicate-checkin guard StudentAttendance.js already has at the DB
// level — the check-in flow (trainerAttendanceController.js) only did an
// app-level findOne-then-create check before this, leaving a race window
// where two near-simultaneous check-ins could both pass that check.
trainerAttendanceSchema.index({ trainer: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('TrainerAttendance', trainerAttendanceSchema);
