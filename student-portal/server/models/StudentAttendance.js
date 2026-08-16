const mongoose = require('mongoose');

// Mirror of the main app's StudentAttendance model. Historically read-only
// (the student portal only ever displayed the logged-in student's own
// records) — now also written to by the self-mark-attendance flow (see
// attendanceRequestController.selfMarkPresent), so studentName/rollNumber/
// campus were added here too: the main app's canonical model requires them,
// and since each app's Mongoose instance only enforces its own schema on
// writes, omitting them here would have silently produced an incomplete
// document good enough for this portal's own read queries but broken for
// Super Admin/Sub-Admin's. Explicit collection name, matching the main
// app's own StudentAttendance.js exactly rather than trusting pluralization
// to agree.
const studentAttendanceSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    studentName: { type: String },
    rollNumber: { type: Number },
    date: { type: Date },
    status: { type: String, enum: ['present', 'absent', 'leave'] },
    course: { type: String, trim: true },
    campus: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('StudentAttendance', studentAttendanceSchema, 'studentattendances');
