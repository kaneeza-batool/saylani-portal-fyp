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

const quizSchema = new mongoose.Schema(
  {
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
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

module.exports = mongoose.model('Quiz', quizSchema);
