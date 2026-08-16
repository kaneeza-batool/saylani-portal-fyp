const mongoose = require('mongoose');

// Exact mirror of public-website/server/models/Course.js — this collection
// is the public website's own course catalog (real marketing content it
// actively serves on /programs), not a resource this app owns. Nothing here
// references a Course by id: Student.course and Slot.course are both plain
// strings (see their own models), and reportsController's only use is a bare
// Course.countDocuments(). This model exists solely so the super-admin
// Courses page can display what's actually in the shared `courses`
// collection — see courseRoutes.js, which is read-only for exactly this
// reason (two write paths against one collection is what broke this before).
const curriculumMonthSchema = new mongoose.Schema(
  {
    monthNumber: { type: Number, required: true, min: 1 },
    title: { type: String, required: true, trim: true },
    topics: { type: [String], default: [] },
  },
  { _id: false }
);

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    category: {
      type: String,
      required: true,
      enum: ['basic', 'web', 'data', 'cloud', 'security', 'creative', 'vocational'],
    },
    duration: { type: String, required: true, trim: true },
    seats: { type: Number, default: 0, min: 0 },
    codingRequired: { type: Boolean, default: false },
    languages: { type: [String], default: [] },
    tools: { type: [String], default: [] },
    desc: { type: String, required: true, trim: true },
    img: { type: String, trim: true, default: '' },
    tags: { type: String, trim: true, default: '' },
    roadmap: { type: [String], default: [] },
    tagline: { type: String, trim: true, default: '' },
    curriculum: { type: [curriculumMonthSchema], default: [] },
    careerOutcomes: { type: [String], default: [] },
    idealFor: { type: String, trim: true, default: '' },
    imageUrl: { type: String, trim: true, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Course', courseSchema);
