const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
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

// One certificate per student per course — re-fetching after it already
// exists must return the same record, never mint a second one.
certificateSchema.index({ student: 1, course: 1 }, { unique: true });

module.exports = mongoose.model('Certificate', certificateSchema);
