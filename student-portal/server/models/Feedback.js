const mongoose = require('mongoose');

const FEEDBACK_TYPES = ['bug', 'idea', 'other'];

const feedbackSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    type: { type: String, enum: FEEDBACK_TYPES, required: true },
    text: { type: String, required: true, trim: true },
    imageUrl: { type: String, default: '' },
  },
  { timestamps: true }
);

const Feedback = mongoose.model('Feedback', feedbackSchema);
Feedback.TYPES = FEEDBACK_TYPES;

module.exports = Feedback;
