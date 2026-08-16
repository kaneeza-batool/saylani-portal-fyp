const mongoose = require('mongoose');

// Read mirror of student-portal/server/models/QuizAttempt.js — field-for-field
// identical. Unlike assignments/quizzes, quiz attempts had no mirror on this
// server before the Trainer Portal "Students" roster needed a real quiz
// average; this is that mirror, read-only from this side (this server never
// writes an attempt, only student-portal does).
//
// `student` refs 'Student' — the real main-app Student model already
// registered on this server, same as StudentPortalAssignmentSubmission.
// `quiz` refs 'StudentPortalQuiz' (this server's local name for the mirrored
// quizzes collection), not 'Quiz' — this server's own 'Quiz' model is an
// unrelated admin oversight summary. student-portal's model declares no
// explicit collection name, so Mongoose's default pluralization
// ('quizattempts') is what's actually on disk — matched here explicitly so
// this still resolves correctly if a future rename changes the default.
const quizAttemptSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentPortalQuiz', required: true, index: true },
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

module.exports = mongoose.model('StudentPortalQuizAttempt', quizAttemptSchema, 'quizattempts');
