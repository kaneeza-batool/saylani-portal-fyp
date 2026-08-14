const mongoose = require('mongoose');

// Written by server/utils/alertEngine.js (a node-cron job), not by any
// user-facing create form — these are system-detected conditions
// (consecutive absences, overdue payment), resolved by an admin.
const alertSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['attendance', 'payment'], required: true },
    severity: { type: String, enum: ['warning', 'critical'], default: 'warning' },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    studentName: { type: String, required: true },
    // Resolved server-side from student.campus at creation time (see
    // alertEngine.js) — never trust a campus passed in, there's no
    // user-facing create form for Alert anyway. Real ObjectId ref, so
    // req.campusFilter is safe to use directly against this field (unlike
    // StudentAttendance.campus, which is a cached name string).
    campus: { type: mongoose.Schema.Types.ObjectId, ref: 'Campus', required: true, index: true },
    message: { type: String, required: true },
    status: { type: String, enum: ['active', 'resolved'], default: 'active' },
  },
  { timestamps: true }
);

// One active alert per (student, type) — re-running the engine shouldn't
// spam duplicate alerts for a condition that's already flagged.
alertSchema.index({ student: 1, type: 1, status: 1 });

module.exports = mongoose.model('Alert', alertSchema);
