const mongoose = require('mongoose');

// 70% to pass — chosen so the seeded 68% prior attempt (the real screenshot's
// scenario) reproduces as FAILED, matching the source data exactly.
const PASS_THRESHOLD_PERCENT = 70;

const quizAttemptSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true, index: true },
    // One entry per question, in question order; null = unanswered.
    answers: { type: [{ type: Number, default: null }], default: [] },
    score: { type: Number, required: true },
    percentage: { type: Number, required: true },
    status: { type: String, enum: ['passed', 'failed'], required: true },
    tabSwitchCount: { type: Number, default: 0 },
    fullscreenExitCount: { type: Number, default: 0 },
    startedAt: { type: Date, required: true },
    submittedAt: { type: Date, required: true },
    attemptNumber: { type: Number, required: true },
  },
  { timestamps: true }
);

quizAttemptSchema.index({ student: 1, quiz: 1, attemptNumber: -1 });

const QuizAttempt = mongoose.model('QuizAttempt', quizAttemptSchema);
QuizAttempt.PASS_THRESHOLD_PERCENT = PASS_THRESHOLD_PERCENT;

module.exports = QuizAttempt;
