const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema(
  {
    // No field-level `index: true` here — the unique index below already
    // covers `student`, and declaring both throws a duplicate-index warning.
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    // Plain course name string, not a Course ref — one course per student
    // now (see Student.js), so there's no Enrollment/Course document to
    // point at. Kept for display/hashing, not a foreign key.
    course: { type: String, required: true, trim: true },
    // Human-readable, e.g. "TITAN-WD-2026-00001" — see certificateController's
    // generateCertificateId (course-code + issue year + zero-padded sequence).
    certificateId: { type: String, required: true, unique: true, trim: true },
    issueDate: { type: Date, required: true, default: Date.now },
    // SHA-256 of certificateId|studentId|courseId|issueDate (see
    // certificateController's computeVerificationHash). Recomputed fresh on
    // every /verify request and compared against this stored value, so
    // tampering with any of those fields directly in the DB — grade,
    // issue date, whose certificate it is — makes verification fail even
    // though the record still looks structurally complete.
    verificationHash: { type: String, required: true },
    finalGrade: { type: String, required: true },
    attendancePercent: { type: Number, required: true },
    quizAverage: { type: Number, required: true },
  },
  { timestamps: true }
);

// One certificate per student — one course per student now (see Student.js),
// so "per course" and "per student" are the same invariant. Re-fetching
// after it already exists must return the same record, never mint a second one.
certificateSchema.index({ student: 1 }, { unique: true });

module.exports = mongoose.model('Certificate', certificateSchema);
