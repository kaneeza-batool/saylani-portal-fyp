const mongoose = require('mongoose');

// Mirror of student-portal's SupportFeedback — students submit bug/idea/
// other feedback from their own portal (port 5100), Super Admin and
// Sub-Admin read/respond to it from here. Explicit collection name matching
// the real model exactly (same mirror pattern as StudentPortalQuiz/
// StudentPortalAssignment).
const supportFeedbackSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    type: { type: String, enum: ['bug', 'idea', 'other'], required: true },
    text: { type: String, required: true, trim: true },
    imageUrl: { type: String, default: '' },
    campus: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'reviewed', 'resolved'], default: 'pending' },
    adminResponse: { type: String, default: '' },
    respondedByName: { type: String, default: '' },
    respondedByRole: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('StudentPortalSupportFeedback', supportFeedbackSchema, 'supportfeedbacks');
