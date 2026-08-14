const mongoose = require('mongoose');

const topicSchema = new mongoose.Schema(
  {
    topicName: { type: String, required: true, trim: true },
    isCompleted: { type: Boolean, default: false },
  },
  { _id: true }
);

const courseModuleSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    moduleName: { type: String, required: true, trim: true },
    order: { type: Number, required: true },
    topics: { type: [topicSchema], default: [] },
  },
  { timestamps: true }
);

courseModuleSchema.index({ student: 1, courseId: 1, order: 1 });

module.exports = mongoose.model('CourseModule', courseModuleSchema);
