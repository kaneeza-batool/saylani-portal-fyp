const mongoose = require('mongoose');

// Mirror of the main app's StudentAttendance model. Read-only from this
// portal's side — attendance itself is marked by Super Admin/Sub-Admin's
// QR-code scan in the main app (see server/controllers/attendanceScanController.js
// there), with a request-a-correction flow as the only write path here (see
// attendanceRequestController.js). studentName/rollNumber/campus are kept
// on this model too since the main app's canonical model requires them, and
// each app's Mongoose instance only enforces its own schema on writes — so
// omitting them here would produce a document good enough for this portal's
// own read queries but incomplete for Super Admin/Sub-Admin's. Explicit
// collection name, matching the main app's own StudentAttendance.js exactly
// rather than trusting pluralization to agree.
const studentAttendanceSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    studentName: { type: String },
    rollNumber: { type: String },
    date: { type: Date },
    status: { type: String, enum: ['present', 'absent', 'leave'] },
    course: { type: String, trim: true },
    campus: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('StudentAttendance', studentAttendanceSchema, 'studentattendances');
