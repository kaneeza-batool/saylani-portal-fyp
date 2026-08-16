const mongoose = require('mongoose');

// A file a trainer shares with students in one of their own courses.
// `trainer` + `course` is the ownership/scoping key — same pair
// trainerStudentAttendanceController's myBatchIdsForCourse already uses to
// decide what a trainer owns, and what studentController/resourceController
// on the student-portal side uses (via a mirrored copy of this model) to
// decide which resources a given student can see.
const resourceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    fileUrl: { type: String, required: true },
    fileName: { type: String, required: true },
    fileType: { type: String, trim: true, default: '' },
    course: { type: String, required: true, trim: true },
    trainer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    trainerName: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Resource', resourceSchema, 'resources');
