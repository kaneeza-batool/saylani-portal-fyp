const mongoose = require('mongoose');

// A student's self-service dispute against one of their own StudentAttendance
// records (e.g. marked absent but was actually present) — the student-facing
// counterpart to AttendanceRequest (trainers disputing their own check-in/
// out). Always created from the Student Portal (see the mirror of this exact
// model/collection under student-portal/server/models), resolved from here
// by Super Admin or Sub-Admin — same "first approver wins" pattern as
// AttendanceRequest.resolveRequest.
const studentAttendanceRequestSchema = new mongoose.Schema(
  {
    // Optional — null means "no record exists yet, create one" (a student
    // requesting attendance for a day nobody marked at all), as opposed to
    // disputing an existing record. See resolveRequest below for how each
    // case is handled on approval.
    attendanceRecord: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentAttendance', default: null },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    studentName: { type: String, required: true }, // cached for display
    rollNumber: { type: Number, required: true },
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

// Explicit collection name so the student-portal mirror model points at
// exactly this collection rather than trusting pluralization to agree.
module.exports = mongoose.model('StudentAttendanceRequest', studentAttendanceRequestSchema, 'studentattendancerequests');
