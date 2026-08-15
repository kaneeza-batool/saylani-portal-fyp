const mongoose = require('mongoose');

// Write mirror of student-portal/server/models/Quiz.js — field-for-field
// identical (copied, not reinvented) because this is a genuine shared
// resource: quizzes created here by a trainer must be readable by Student
// Portal's own Quiz model with zero changes on that side. Explicit
// collection name for the same reason — this server's own Quiz model
// (title/course/campus/attempts/avg/status, an admin oversight summary)
// already owns the default 'quizzes' collection.
//
// `course` is a plain name string, not an ObjectId ref — matches Student
// Portal's own convention (a student's course is a free-text field on
// their Student document, no Course collection to look up), confirmed by
// quizController.getQuizzes: `Quiz.find({ course: req.student.course })`.
const questionSchema = new mongoose.Schema(
  {
    questionText: { type: String, required: true, trim: true },
    options: {
      type: [{ type: String, trim: true }],
      validate: { validator: (v) => v.length === 4, message: 'Each question needs exactly 4 options' },
    },
    correctOptionIndex: { type: Number, required: true, min: 0, max: 3 },
    marks: { type: Number, required: true, default: 1 },
    explanation: { type: String, required: true, trim: true },
  },
  { _id: true }
);

const studentPortalQuizSchema = new mongoose.Schema(
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
    // Not on student-portal's schema — additive here, harmless to that
    // side (an undeclared path is simply invisible to a schema that
    // doesn't know about it, same one-way mirroring behavior documented
    // throughout this codebase). Lets the Trainer Portal show "my quizzes"
    // without needing a separate ownership-tracking collection.
    createdByTrainer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  },
  { timestamps: true }
);

studentPortalQuizSchema.pre('validate', function computeTotalMarks() {
  if (this.questions?.length) {
    this.totalMarks = this.questions.reduce((sum, q) => sum + (q.marks || 0), 0);
  }
});

module.exports = mongoose.model('StudentPortalQuiz', studentPortalQuizSchema, 'studentportal_quizzes');
