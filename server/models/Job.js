const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    // Set only for a job posted by a self-service employer (see
    // employerPortalController.js) — optional so existing/admin-created
    // jobs (Job.company as a free-text string, no real Employer link) keep
    // working unchanged. `company` stays the display field either way.
    employer: { type: mongoose.Schema.Types.ObjectId, ref: 'Employer', index: true },
    location: { type: String, default: '', trim: true },
    type: { type: String, enum: ['Full-time', 'Part-time', 'Internship', 'Contract'], default: 'Full-time' },
    status: { type: String, enum: ['open', 'closed'], default: 'open' },
    description: { type: String, default: '', trim: true },
    requirements: { type: [String], default: [] },
    // Separate from `status` — a job can be open internally while the admin
    // is still drafting it, and only becomes visible on the public careers
    // page once explicitly published.
    published: { type: Boolean, default: false },
    // Optional — a job with no deadline stays open indefinitely (same as
    // today). Once set, publicJobController checks it alongside
    // status:'open' on every public read/apply, same enforcement point as
    // status so a job can't be applied to through a stale cached page after
    // its deadline passes.
    applicationDeadline: { type: Date, default: null },
    // Optional threshold on computeMatchScore's 0-100 output (see
    // utils/matchScore.js) — when set, JobApplicationsPage badges any
    // applicant at or above this score as a "Strong match" so an admin can
    // shortlist by criteria instead of reading every application by hand.
    // Purely a display aid: never auto-changes an application's status.
    minMatchScoreForShortlist: { type: Number, min: 0, max: 100, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Job', jobSchema);
