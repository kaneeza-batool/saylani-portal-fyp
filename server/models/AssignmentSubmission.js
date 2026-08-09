const mongoose = require('mongoose');

// Statuses are listed for documentation/frontend-contract purposes, but
// 'not_submitted' is never actually persisted — a submission document
// only exists once a student has submitted something. The Assignment
// list endpoint reports 'not_submitted' for any assignment that has no
// matching document here. 'approved' / 'not_approved' + trainerRemarks
// are written by the (not-yet-built) Trainer Portal, not by students.
const STATUSES = ['not_submitted', 'submitted', 'late_submitted', 'approved', 'not_approved'];

const assignmentSubmissionSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    assignment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true, index: true },
    submissionLink: { type: String, trim: true },
    referenceImages: [{ type: String, trim: true }],
    submissionText: { type: String, trim: true },
    status: { type: String, enum: STATUSES, default: 'submitted' },
    grade: { type: String, default: '', trim: true },
    trainerRemarks: { type: String, default: '', trim: true },
    submittedAt: { type: Date },
    lastEditedAt: { type: Date },
  },
  { timestamps: true }
);

assignmentSubmissionSchema.index({ student: 1, assignment: 1 }, { unique: true });

const AssignmentSubmission = mongoose.model('AssignmentSubmission', assignmentSubmissionSchema);
AssignmentSubmission.STATUSES = STATUSES;

module.exports = AssignmentSubmission;
