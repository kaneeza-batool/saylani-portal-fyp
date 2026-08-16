const mongoose = require('mongoose');

// Correction requests raised against a TrainerAttendance record (wrong
// check-in/out time, missed check-out, etc.) — the "Attendance Request"
// nav item under Trainers > Attendance in the screenshots.
const attendanceRequestSchema = new mongoose.Schema(
  {
    trainerAttendance: { type: mongoose.Schema.Types.ObjectId, ref: 'TrainerAttendance', required: true },
    // Real link to the Trainer profile that owns this record — lets a
    // logged-in trainer list/filter to only their own requests, and lets
    // createRequest verify a self-service submission is against the
    // caller's own attendance, not someone else's. Not required at the
    // schema level so it stays optional for any pre-existing rows created
    // before this field existed.
    trainer: { type: mongoose.Schema.Types.ObjectId, ref: 'Trainer', default: null },
    trainerName: { type: String, required: true },
    campus: { type: String, default: '' },
    schedule: { type: String, default: '' },
    requestedCheckIn: { type: Date, default: null },
    requestedCheckOut: { type: Date, default: null },
    reason: { type: String, required: true, trim: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    // Who actually resolved it — Super Admin and Sub-Admin can both see and
    // act on the same request, so this records which one got there first.
    resolvedByName: { type: String, default: '' },
    resolvedByRole: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AttendanceRequest', attendanceRequestSchema);
