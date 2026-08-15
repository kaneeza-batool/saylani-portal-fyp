const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    batch: { type: String, trim: true },
    rollNumber: { type: String, trim: true },
    campus: { type: String, trim: true },
    city: { type: String, trim: true },
    status: { type: String, enum: ['enrolled', 'completed', 'dropped'], default: 'enrolled' },
    // Denormalized cache of Progress's weighted topic-completion percentage,
    // computed at seed/enrollment time — cheap to show on the course-picker
    // card without a join. Since nothing currently lets a student mutate
    // CourseModule topics at runtime, this can't drift out of sync yet; if
    // that ever changes, recompute it whenever topics change.
    progressPercent: { type: Number, default: 0 },
    enrolledAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

module.exports = mongoose.model('Enrollment', enrollmentSchema);
