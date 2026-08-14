const mongoose = require('mongoose');

// Month-by-month outline (replaced the old flat {module, topics} shape on
// 2026-08-14 so the curriculum reads as an explicit monthly plan matching
// the course's duration). monthNumber is positional (1-indexed) and kept in
// sync with array order by the admin form and migration script.
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
    // --- Core catalog fields (migrated from the original static courses.js) ---
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

    // Per-campus availability fields (isOnlineAvailable, registrationStatus,
    // isOnCampus, isOnline) removed 2026-08-14 — see audit. A single global
    // value per course can't honestly represent delivery mode or
    // registration status once a course runs at more than one campus.
    // Option A (a real CourseOffering model: course + campus + deliveryMode
    // + registrationStatus) is the correct long-term fix, deferred until we
    // know how staff want to manage multi-campus batches. The public site
    // shows a generic "contact your campus" line instead for now.

    // --- Admin-controlled fields ---
    imageUrl: { type: String, trim: true, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Course', courseSchema);
