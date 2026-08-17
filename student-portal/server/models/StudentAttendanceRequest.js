const mongoose = require('mongoose');

// Mirror of the main app's StudentAttendanceRequest — this portal is the
// only place these get CREATED (a student disputing their own attendance);
// Super Admin/Sub-Admin read and resolve them from the main app. Explicit
// collection name, matching the main app's model exactly (same convention
// as StudentAttendance.js in this same folder).
const studentAttendanceRequestSchema = new mongoose.Schema(
  {
    // Optional now — a student can also request attendance for a day no
    // StudentAttendance record exists for at all yet (e.g. self-marking
    // wasn't available and the trainer hasn't marked the class either), not
    // only dispute an existing one. null here means "create a new record",
    // handled by whichever admin resolves it (see the main app's
    // studentAttendanceRequestController.resolveRequest).
    attendanceRecord: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentAttendance', default: null },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    studentName: { type: String, required: true },
    rollNumber: { type: String, required: true },
    course: { type: String, default: '' },
    campus: { type: String, default: '' },
    date: { type: Date, required: true },
    currentStatus: { type: String, enum: ['present', 'absent', 'leave', 'not_marked'], required: true },
    requestedStatus: { type: String, enum: ['present', 'absent', 'leave'], required: true },
    reason: { type: String, required: true, trim: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    resolvedByName: { type: String, default: '' },
    resolvedByRole: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('StudentAttendanceRequest', studentAttendanceRequestSchema, 'studentattendancerequests');
