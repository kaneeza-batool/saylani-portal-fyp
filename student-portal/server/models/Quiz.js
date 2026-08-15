const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    questionText: { type: String, required: true, trim: true },
    options: {
      type: [{ type: String, trim: true }],
      validate: { validator: (v) => v.length === 4, message: 'Each question needs exactly 4 options' },
    },
    correctOptionIndex: { type: Number, required: true, min: 0, max: 3 },
    marks: { type: Number, required: true, default: 1 },
    // Shown only after submission, on the results review — never sent to
    // the client while a quiz is in progress (see getQuizForTaking).
    explanation: { type: String, required: true, trim: true },
  },
  { _id: true }
);

// One course per student (see Student.js) — course is a plain name string,
// not an ObjectId, so there's no Course collection to look up (same fix as
// StudentAttendance.js/Assignment.js). Every handler filters this shared
// catalog by the logged-in student's own course.
const quizSchema = new mongoose.Schema(
  {
    course: { type: String, required: true, trim: true, index: true },
    module: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    questions: {
      type: [questionSchema],
      validate: { validator: (v) => v.length > 0, message: 'A quiz needs at least one question' },
    },
    totalMarks: { type: Number, required: true },
    durationMinutes: { type: Number, required: true },
  },
  { timestamps: true }
);

quizSchema.pre('validate', function computeTotalMarks() {
  if (this.questions?.length) {
    this.totalMarks = this.questions.reduce((sum, q) => sum + (q.marks || 0), 0);
  }
});

// Explicit collection name — main app has its own unrelated Quiz model (an
// admin oversight summary: title/course/campus/attempts/avg/status, no
// question content) that would otherwise land on the same default-
// pluralized 'quizzes' collection now that both apps share one database.
// Model name stays 'Quiz' so nothing else needs to change.
module.exports = mongoose.model('Quiz', quizSchema, 'studentportal_quizzes');
