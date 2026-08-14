const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    location: { type: String, default: '', trim: true },
    type: { type: String, enum: ['Full-time', 'Part-time', 'Internship', 'Contract'], default: 'Full-time' },
    status: { type: String, enum: ['open', 'closed'], default: 'open' },
    description: { type: String, default: '', trim: true },
    requirements: { type: [String], default: [] },
    // Separate from `status` — a job can be open internally while the admin
    // is still drafting it, and only becomes visible on the public careers
    // page once explicitly published.
    published: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Job', jobSchema);
