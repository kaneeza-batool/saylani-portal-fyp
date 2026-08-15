const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true }, // author
    // One course per student (see Student.js) — course is a plain name
    // string, not an ObjectId, so there's no Course collection to look up
    // (same fix as Assignment.js/Quiz.js). Matched against the logged-in
    // student's own Student.course in questionController.
    course: { type: String, required: true, trim: true, index: true },
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    // Free-text module/topic name, not an ObjectId ref — CourseModule docs
    // are per-student (each student has their own copy for their own
    // progress tracking), so there's no single shared "the React Basics
    // module" record every student's question could point at. A plain
    // label achieves the same "tag this to a topic" purpose safely.
    moduleTag: { type: String, trim: true, default: '' },
    upvoteCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

questionSchema.index({ course: 1, createdAt: -1 });

module.exports = mongoose.model('Question', questionSchema);
