const mongoose = require('mongoose');

// Correction requests raised against a TrainerAttendance record (wrong
// check-in/out time, missed check-out, etc.) — the "Attendance Request"
// nav item under Trainers > Attendance in the screenshots.
const attendanceRequestSchema = new mongoose.Schema(
  {
    trainerAttendance: { type: mongoose.Schema.Types.ObjectId, ref: 'TrainerAttendance', required: true },
    trainerName: { type: String, required: true },
    campus: { type: String, default: '' },
    schedule: { type: String, default: '' },
    requestedCheckIn: { type: Date, default: null },
    requestedCheckOut: { type: Date, default: null },
    reason: { type: String, required: true, trim: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AttendanceRequest', attendanceRequestSchema);
