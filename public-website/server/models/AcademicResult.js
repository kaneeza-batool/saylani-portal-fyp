const mongoose = require('mongoose');

// Deliberately separate from EntryTestApplicant — "Check Result" on the
// public site means a later academic/course result, not the entry test
// outcome. Keeping them as two collections (rather than one overloaded
// model) is what lets /entry-test-status and /check-result stay honest
// about being two different stages of a student's timeline.
const academicResultSchema = new mongoose.Schema(
  {
    application: { type: mongoose.Schema.Types.ObjectId, ref: 'Application' },
    fullName: { type: String, required: true, trim: true },
    cnic: {
      type: String,
      required: true,
      trim: true,
      match: [/^\d{13}$/, 'CNIC must be 13 digits'],
    },
    referenceNumber: { type: String, required: true, trim: true },
    selectedProgram: { type: String, required: true, trim: true },
    batch: { type: String, trim: true, default: '' },
    examName: { type: String, required: true, trim: true },
    resultStatus: {
      type: String,
      enum: ['pending', 'pass', 'fail'],
      default: 'pending',
    },
    score: { type: Number, min: 0, max: 100 },
    publishedDate: { type: Date },
  },
  { timestamps: true }
);

academicResultSchema.index({ cnic: 1 });
academicResultSchema.index({ referenceNumber: 1 });

module.exports = mongoose.model('AcademicResult', academicResultSchema);
