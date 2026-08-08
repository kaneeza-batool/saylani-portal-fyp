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

module.exports = mongoose.model('TrainerAttendance', trainerAttendanceSchema);
