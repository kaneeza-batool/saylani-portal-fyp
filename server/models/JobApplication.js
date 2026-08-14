const mongoose = require('mongoose');

const jobApplicationSchema = new mongoose.Schema(
  {
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
    jobTitle: { type: String, required: true }, // cached for display without a populate
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    address: { type: String, default: '', trim: true },
    education: { type: String, required: true, trim: true },
    experience: { type: String, default: '', trim: true },
    skills: { type: String, default: '', trim: true },
    resumeUrl: { type: String, required: true },
    photoUrl: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'reviewed', 'shortlisted', 'rejected'], default: 'pending' },
    // Keyword-overlap score (0-100) against the job's requirements/description,
    // computed once at submission time. Null when the job had no requirements
    // text to compare against.
    matchScore: { type: Number, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('JobApplication', jobApplicationSchema);
