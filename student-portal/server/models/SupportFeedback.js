const mongoose = require('mongoose');

// Renamed from Feedback → SupportFeedback as part of the shared-database
// migration: student-portal now points at the same MongoDB database as the
// main app, which has its own unrelated `Feedback` model (course/trainer
// ratings, collection `feedbacks`). Without this rename, Mongoose's default
// pluralization would map both models onto the same collection name and mix
// two unrelated document shapes together. Explicit collection name below,
// not left to pluralization, so that can never happen again by accident.
const FEEDBACK_TYPES = ['bug', 'idea', 'other'];

const STATUSES = ['pending', 'reviewed', 'resolved'];

const supportFeedbackSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    type: { type: String, enum: FEEDBACK_TYPES, required: true },
    text: { type: String, required: true, trim: true },
    imageUrl: { type: String, default: '' },
    // Cached display name, same convention as StudentAttendance.campus —
    // lets Super Admin/Sub-Admin filter/scope without a populate.
    campus: { type: String, default: '' },
    status: { type: String, enum: STATUSES, default: 'pending' },
    adminResponse: { type: String, default: '' },
    respondedByName: { type: String, default: '' },
    respondedByRole: { type: String, default: '' },
  },
  { timestamps: true }
);

const SupportFeedback = mongoose.model('SupportFeedback', supportFeedbackSchema, 'supportfeedbacks');
SupportFeedback.TYPES = FEEDBACK_TYPES;
SupportFeedback.STATUSES = STATUSES;

module.exports = SupportFeedback;
