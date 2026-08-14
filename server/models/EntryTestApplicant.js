const mongoose = require('mongoose');

// Links back to an Application (from the Enroll Now flow) by cnic and
// referenceNumber rather than a populated ref — this collection is looked
// up directly by whichever ID the visitor has on hand, so denormalizing
// the display fields avoids a join on every status check.
const entryTestApplicantSchema = new mongoose.Schema(
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
    testStatus: {
      type: String,
      enum: ['not_scheduled', 'scheduled', 'completed'],
      default: 'not_scheduled',
    },
    testDate: { type: Date },
    testCenter: { type: String, trim: true, default: '' },
    testResult: {
      type: String,
      enum: ['pass', 'fail', 'pending'],
      default: 'pending',
    },
    score: { type: Number, min: 0, max: 100 },
  },
  { timestamps: true }
);

entryTestApplicantSchema.index({ cnic: 1 });
entryTestApplicantSchema.index({ referenceNumber: 1 });

module.exports = mongoose.model('EntryTestApplicant', entryTestApplicantSchema);
