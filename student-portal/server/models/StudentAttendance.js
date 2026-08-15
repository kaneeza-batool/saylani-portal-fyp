const mongoose = require('mongoose');

// Minimal, read-only mirror of the main app's StudentAttendance model — the
// student portal never writes attendance, only ever reads the logged-in
// student's own records (see attendanceController). The real write-side
// document also carries studentName/rollNumber/campus, but this portal only
// needs student/date/status/course for its own display, so those aren't
// declared here (same reasoning as Campus.js: unused fields would just be
// duplication). Explicit collection name, matching the main app's own
// StudentAttendance.js exactly rather than trusting pluralization to agree.
const studentAttendanceSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  date: { type: Date },
  status: { type: String, enum: ['present', 'absent', 'leave'] },
  course: { type: String, trim: true },
});

module.exports = mongoose.model('StudentAttendance', studentAttendanceSchema, 'studentattendances');
