const Job = require('../models/Job');
const Employer = require('../models/Employer');
const JobApplication = require('../models/JobApplication');
const { logAudit } = require('../utils/auditLogger');
const { sendMail } = require('../utils/mailer');

// Every handler here is scoped to the logged-in employer's OWN records —
// req.user is a User{role:'employer'}, joined to its Employer company
// profile by email (same join key registerEmployer/registerTrainer already
// establish). Loaded once per request rather than per-handler so a stale
// email mismatch (Employer record deleted/renamed) fails the same way
// everywhere: a clean 404, not a partial/inconsistent response.
async function loadMyEmployer(req, res) {
  const employer = await Employer.findOne({ contactEmail: req.user.email.toLowerCase() });
  if (!employer) {
    res.status(404).json({ message: 'No employer profile is linked to this account.' });
    return null;
  }
  return employer;
}

exports.getMyEmployerProfile = async (req, res) => {
  try {
    const employer = await loadMyEmployer(req, res);
    if (!employer) return;
    return res.status(200).json({ employer });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load employer profile', error: err.message });
  }
};

exports.listMyJobs = async (req, res) => {
  try {
    const employer = await loadMyEmployer(req, res);
    if (!employer) return;

    const jobs = await Job.find({ employer: employer._id }).sort({ createdAt: -1 });
    return res.status(200).json({ items: jobs });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load jobs', error: err.message });
  }
};

// A job only ever goes public (published: true) once the owning Employer is
// status: 'verified' — regardless of what the employer requests, until a
// super-admin approves them via the existing EmployersPage.jsx. This is the
// only place Employer.status has ever had real teeth; previously it was a
// CRM-style field super-admin set with nothing downstream reading it.
exports.createMyJob = async (req, res) => {
  try {
    const employer = await loadMyEmployer(req, res);
    if (!employer) return;

    const { title, location, type, description, requirements, published } = req.body;
    if (!title?.trim()) return res.status(400).json({ message: 'Job title is required' });

    const wantsPublished = !!published;
    const canPublish = employer.status === 'verified';

    const job = await Job.create({
      title: title.trim(),
      company: employer.companyName,
      employer: employer._id,
      location: location || '',
      type: type || 'Full-time',
      status: 'open',
      description: description || '',
      requirements: Array.isArray(requirements) ? requirements : [],
      published: wantsPublished && canPublish,
    });

    logAudit({
      actor: req.user,
      action: 'create',
      resourceType: 'Job',
      resourceId: job._id,
      summary: `Employer "${employer.companyName}" posted "${job.title}"`,
    });

    return res.status(201).json({
      job,
      notice: wantsPublished && !canPublish ? 'Saved as a draft — your company must be verified before a job can go public.' : null,
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to create job', error: err.message });
  }
};

exports.updateMyJob = async (req, res) => {
  try {
    const employer = await loadMyEmployer(req, res);
    if (!employer) return;

    const existing = await Job.findOne({ _id: req.params.id, employer: employer._id });
    if (!existing) return res.status(404).json({ message: 'Job not found' });

    const { title, location, type, status, description, requirements, published } = req.body;
    const canPublish = employer.status === 'verified';

    const update = {};
    if (title !== undefined) update.title = title.trim();
    if (location !== undefined) update.location = location;
    if (type !== undefined) update.type = type;
    if (status !== undefined) update.status = status;
    if (description !== undefined) update.description = description;
    if (requirements !== undefined) update.requirements = Array.isArray(requirements) ? requirements : [];
    if (published !== undefined) update.published = !!published && canPublish;

    const job = await Job.findByIdAndUpdate(existing._id, update, { new: true, runValidators: true });

    logAudit({
      actor: req.user,
      action: 'update',
      resourceType: 'Job',
      resourceId: job._id,
      summary: `Employer "${employer.companyName}" updated "${job.title}"`,
    });

    return res.status(200).json({
      job,
      notice: published && !canPublish ? 'Saved as a draft — your company must be verified before a job can go public.' : null,
    });
  } catch (err) {
    if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
    return res.status(500).json({ message: 'Failed to update job', error: err.message });
  }
};

exports.listMyJobApplications = async (req, res) => {
  try {
    const employer = await loadMyEmployer(req, res);
    if (!employer) return;

    const myJobIds = await Job.find({ employer: employer._id }, '_id');
    const filter = { job: { $in: myJobIds.map((j) => j._id) } };
    if (req.query.job) {
      // Ownership check — a jobId the employer doesn't own must 403, not
      // silently return another employer's applications for it.
      const owns = myJobIds.some((j) => j._id.toString() === req.query.job);
      if (!owns) return res.status(403).json({ message: 'You do not have access to this job' });
      filter.job = req.query.job;
    }

    const items = await JobApplication.find(filter).sort({ createdAt: -1 });
    return res.status(200).json({ items });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load applications', error: err.message });
  }
};

// Same status pipeline/applicant-email-notify shape as the super-admin's
// jobApplicationController.updateApplicationStatus — this is the
// employer-scoped equivalent, ownership-checked via a join against the
// employer's own Job ids rather than trusting the applicationId alone.
exports.updateMyJobApplicationStatus = async (req, res) => {
  try {
    const employer = await loadMyEmployer(req, res);
    if (!employer) return;

    const { status } = req.body;
    if (!['pending', 'reviewed', 'shortlisted', 'hired', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const myJobIds = (await Job.find({ employer: employer._id }, '_id')).map((j) => j._id);
    const application = await JobApplication.findOne({ _id: req.params.id, job: { $in: myJobIds } });
    if (!application) return res.status(404).json({ message: 'Application not found' });

    const update = { status, hiredAt: status === 'hired' ? new Date() : null };
    const item = await JobApplication.findByIdAndUpdate(application._id, update, { new: true });

    logAudit({
      actor: req.user,
      action: 'update',
      resourceType: 'JobApplication',
      resourceId: item._id,
      summary: `Employer "${employer.companyName}" marked application from "${item.fullName}" for "${item.jobTitle}" as ${status}`,
    });

    const STATUS_COPY = {
      pending: { label: 'Pending', tone: '#B7791F', line: 'Your application is in our queue awaiting review.' },
      reviewed: { label: 'Reviewed', tone: '#2B6CB0', line: 'Our team has reviewed your application.' },
      shortlisted: { label: 'Shortlisted', tone: '#1B6B45', line: "Congratulations — you've been shortlisted! We'll be in touch about next steps." },
      hired: { label: 'Hired', tone: '#1B6B45', line: "Congratulations — you've been hired! Our team will reach out shortly with onboarding details." },
      rejected: { label: 'Not Selected', tone: '#C0392B', line: "We've decided to move forward with other candidates for this role. Thank you for your interest." },
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
