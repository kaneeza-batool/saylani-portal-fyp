const mongoose = require('mongoose');

// Field shape matches QUIZ_SEED from the TITAN design file exactly
// (title, course, campus, attempts, avg, status).
const quizSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    course: { type: String, required: true, trim: true },
    campus: { type: String, required: true, trim: true },
    attempts: { type: Number, default: 0, min: 0 },
    avg: { type: Number, default: 0, min: 0, max: 100 },
    status: { type: String, enum: ['Scheduled', 'Live', 'Completed'], default: 'Scheduled' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Quiz', quizSchema);
