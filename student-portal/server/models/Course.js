const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, trim: true },
    durationWeeks: { type: Number },
    // Simple weekly recurrence for the Dashboard's class schedule widget —
    // e.g. ['Mon', 'Wed', 'Fri']. One canonical schedule per course, not
    // per-enrollment, since batches within a course share class days.
    classDays: { type: [String], default: [] },
    // NOTE: there used to be stored avgBatchProgress/avgBatchQuizScore/
    // avgBatchAttendance/batchSize fields here. They were fabricated
    // placeholders from before this portal had more than one real student.
    // The Progress Insight and Leaderboard widgets now compute all of that
    // live from real Enrollment/Attendance/QuizAttempt/CourseModule records
    // on every request (see server/utils/courseStats.js) — do not add
    // precomputed/cached batch stats back onto this model.
  },
  { timestamps: true }
);

// Explicit collection name — main app has its own unrelated Course model
// (name/description/durationWeeks/status, currently unused but a real,
// live-creatable admin resource) that would otherwise land on the same
// default-pluralized 'courses' collection now that both apps share one
// database. Model name stays 'Course' so every existing ref: 'Course'
// (Enrollment, Quiz, CourseModule) keeps resolving unchanged — only the
// physical collection moves.
module.exports = mongoose.model('Course', courseSchema, 'studentportal_courses');
