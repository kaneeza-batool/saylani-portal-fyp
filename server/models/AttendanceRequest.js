const mongoose = require('mongoose');

// Correction requests raised against a TrainerAttendance record (wrong
// check-in/out time, missed check-out, etc.) — the "Attendance Request"
// nav item under Trainers > Attendance in the screenshots.
const attendanceRequestSchema = new mongoose.Schema(
  {
    // Optional — null means "no record exists yet, create one on approval"
    // (a trainer requesting attendance for a day nobody marked at all, e.g.
    // a missed check-in), as opposed to disputing an existing record. Same
    // pattern as StudentAttendanceRequest.attendanceRecord. When set, this
    // is a correction on that specific record instead.
    trainerAttendance: { type: mongoose.Schema.Types.ObjectId, ref: 'TrainerAttendance', default: null },
    // Real link to the Trainer profile that owns this record — lets a
    // logged-in trainer list/filter to only their own requests, and lets
    // createRequest verify a self-service submission is against the
    // caller's own attendance, not someone else's. Not required at the
    // schema level so it stays optional for any pre-existing rows created
    // before this field existed.
    trainer: { type: mongoose.Schema.Types.ObjectId, ref: 'Trainer', default: null },
    trainerName: { type: String, required: true },
    // Cached alongside trainerName for the same reason — resolveRequest
    // needs it to create a TrainerAttendance record when trainerAttendance
    // is null, without an extra lookup at resolve time.
    employeeId: { type: String, default: '' },
    campus: { type: String, default: '' },
    schedule: { type: String, default: '' },
    // The day this request is actually about. Always set at creation —
    // copied from the linked TrainerAttendance record when correcting one,
    // or supplied directly by the trainer when requesting a day with no
    // record yet. Needed either way so approval knows which date to
    // create/update, and so the request reads clearly in the approval queue.
    date: { type: Date, default: null },
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
