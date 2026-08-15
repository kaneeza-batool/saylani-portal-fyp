const mongoose = require('mongoose');

const ANSWER_AUTHOR_ROLES = ['student', 'trainer'];

const answerSchema = new mongoose.Schema(
  {
    question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true, index: true },
    // Trainer answers aren't buildable yet — no Trainer Portal/model exists
    // — but `refPath` lets this resolve against either collection once one
    // does, rather than hardcoding `ref: 'Student'` and having to migrate
    // every existing answer later.
    authorRole: { type: String, enum: ANSWER_AUTHOR_ROLES, default: 'student' },
    authorModelName: { type: String, enum: ['Student', 'Trainer'], default: 'Student' },
    author: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'authorModelName' },
    // Denormalized so the answer list never needs a populate() that could
    // fail once trainer answers exist against a collection this schema
    // can't fully validate yet.
    authorName: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    upvoteCount: { type: Number, default: 0 },
    // Settable only by the original question's author (enforced in
    // questionController, not here) — Stack-Overflow-style "solved" marker.
    isAcceptedAnswer: { type: Boolean, default: false },
  },
  { timestamps: true }
);

answerSchema.index({ question: 1, createdAt: 1 });

module.exports = mongoose.model('Answer', answerSchema);
