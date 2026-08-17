const JobApplication = require('../models/JobApplication');
const Job = require('../models/Job');
const { logAudit } = require('../utils/auditLogger');
const { sendMail } = require('../utils/mailer');

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

exports.getApplications = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const { search, status, job, sort } = req.query;

    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (job && job !== 'all') filter.job = job;
    if (search && search.trim()) {
      const re = new RegExp(escapeRegex(search.trim()), 'i');
      filter.$or = [{ fullName: re }, { email: re }, { jobTitle: re }];
    }

    const sortSpec = sort === 'match' ? { matchScore: -1, createdAt: -1 } : { createdAt: -1 };

    const [items, total] = await Promise.all([
      JobApplication.find(filter).sort(sortSpec).skip((page - 1) * limit).limit(limit),
      JobApplication.countDocuments(filter),
    ]);

    return res.status(200).json({ items, total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load applications', error: err.message });
  }
};

exports.getApplication = async (req, res) => {
  try {
    const item = await JobApplication.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Not found' });
    return res.status(200).json({ item });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load application', error: err.message });
  }
};

exports.updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'reviewed', 'shortlisted', 'interview_scheduled', 'hired', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const update = { status, hiredAt: status === 'hired' ? new Date() : null };
    const item = await JobApplication.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!item) return res.status(404).json({ message: 'Not found' });

    logAudit({
      actor: req.user,
      action: 'update',
      resourceType: 'JobApplication',
      resourceId: item._id,
      summary: `Marked application from "${item.fullName}" for "${item.jobTitle}" as ${status}`,
    });

    const STATUS_COPY = {
      pending: { label: 'Pending', tone: '#B7791F', line: 'Your application is in our queue awaiting review.' },
      reviewed: { label: 'Reviewed', tone: '#2B6CB0', line: 'Our team has reviewed your application.' },
      shortlisted: { label: 'Shortlisted', tone: '#1B6B45', line: "Congratulations — you've been shortlisted! We'll be in touch about next steps." },
      interview_scheduled: { label: 'Interview Scheduled', tone: '#1B6B45', line: "Congratulations — you've been selected for an interview! Our team will reach out shortly with the date, time, and details." },
      hired: { label: 'Hired', tone: '#1B6B45', line: "Congratulations — you've been hired! Our team will reach out shortly with onboarding details." },
      rejected: { label: 'Not Selected', tone: '#C0392B', line: "We've decided to move forward with other candidates for this role. Thank you for your interest in TITAN." },
    };
    const copy = STATUS_COPY[status];
    sendMail({
      to: item.email,
      subject: `TITAN — Update on your application for ${item.jobTitle}`,
      html: `<div style="font-family:sans-serif;padding:16px">
        <h2 style="color:#12234A;margin:0 0 8px">Application Status Update</h2>
        <p style="color:#333;margin:0 0 6px">Hi ${item.fullName},</p>
        <p style="color:${copy.tone};font-weight:600;text-transform:uppercase;font-size:12px;margin:0 0 6px">${copy.label}</p>
        <p style="color:#333;margin:0">${copy.line}</p>
      </div>`,
    });

    return res.status(200).json({ item });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update application', error: err.message });
  }
};

exports.deleteApplication = async (req, res) => {
  try {
    const item = await JobApplication.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Not found' });

    logAudit({
      actor: req.user,
      action: 'delete',
      resourceType: 'JobApplication',
      resourceId: item._id,
      summary: `Deleted application from "${item.fullName}" for "${item.jobTitle}"`,
    });

    return res.status(200).json({ message: 'Deleted' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to delete application', error: err.message });
  }
};

exports.getJobOptions = async (req, res) => {
  try {
    const jobs = await Job.find({}, 'title company minMatchScoreForShortlist').sort({ title: 1 });
    return res.status(200).json({ items: jobs });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load jobs', error: err.message });
  }
};
