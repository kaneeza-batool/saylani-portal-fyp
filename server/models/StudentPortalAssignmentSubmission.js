const mongoose = require('mongoose');

// Read/write mirror of student-portal/server/models/AssignmentSubmission.js
// — field-for-field identical. This is the model that makes the actual
// feature requested work: 'approved'/'not_approved' + trainerRemarks were
// already reserved on the canonical schema with a comment saying exactly
// this ("written by the (not-yet-built) Trainer Portal, not by students") —
// this mirror is what finally writes them.
//
// `student` refs 'Student' — the real main-app Student model already
// registered on this server (not a mirror; this server owns that
// collection), so no separate mirror is needed for that ref to resolve.
// `assignment` refs 'StudentPortalAssignment' (this server's local name for
// the mirrored assignments collection), not 'Assignment' — 'Assignment' on
// this server's registry doesn't exist at all, so an unqualified ref here
// would just fail to populate.
const STATUSES = ['not_submitted', 'submitted', 'late_submitted', 'approved', 'not_approved'];

const studentPortalAssignmentSubmissionSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    assignment: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentPortalAssignment', required: true, index: true },
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

const StudentPortalAssignmentSubmission = mongoose.model(
  'StudentPortalAssignmentSubmission',
  studentPortalAssignmentSubmissionSchema,
  'assignmentsubmissions'
);
StudentPortalAssignmentSubmission.STATUSES = STATUSES;

module.exports = StudentPortalAssignmentSubmission;
