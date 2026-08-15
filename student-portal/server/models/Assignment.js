const mongoose = require('mongoose');

// One course per student (see Student.js) — course is a plain name string,
// not an ObjectId, so there's no Course collection to look up (same fix as
// StudentAttendance.js/attendanceController.js). Every handler just filters
// this shared catalog by the logged-in student's own course.
const assignmentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    referenceLinks: [{ type: String, trim: true }],
    dueDate: { type: Date, required: true },
    isHackathon: { type: Boolean, default: false },
    course: { type: String, required: true, trim: true, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Assignment', assignmentSchema);
