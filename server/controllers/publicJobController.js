const Job = require('../models/Job');
const JobApplication = require('../models/JobApplication');
const { computeMatchScore } = require('../utils/matchScore');
const { sendMail } = require('../utils/mailer');

exports.listPublicJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ published: true, status: 'open' }).sort({ createdAt: -1 });
    return res.status(200).json({ items: jobs });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load jobs', error: err.message });
  }
};

exports.getPublicJob = async (req, res) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, published: true, status: 'open' });
    if (!job) return res.status(404).json({ message: 'This job posting is not available.' });
    return res.status(200).json({ item: job });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load job', error: err.message });
  }
};

exports.submitApplication = async (req, res) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, published: true, status: 'open' });
    if (!job) return res.status(404).json({ message: 'This job is no longer accepting applications.' });

    const { fullName, email, phone, address, education, experience, skills } = req.body;
    if (!fullName || !email || !phone || !education) {
      return res.status(400).json({ message: 'Full name, email, phone, and education are required.' });
    }
    if (!req.files?.resume?.[0]) {
      return res.status(400).json({ message: 'A resume/CV file is required.' });
    }

    const application = await JobApplication.create({
      job: job._id,
      jobTitle: job.title,
      fullName,
      email,
      phone,
      address: address || '',
      education,
      experience: experience || '',
      skills: skills || '',
      resumeUrl: `/uploads/resumes/${req.files.resume[0].filename}`,
      photoUrl: req.files.photo?.[0] ? `/uploads/photos/${req.files.photo[0].filename}` : '',
      matchScore: computeMatchScore(job, { skills, experience, education }),
    });

    sendMail({
      to: email,
      subject: `TITAN — We've received your application for ${job.title}`,
      html: `<div style="font-family:sans-serif;padding:16px">
        <h2 style="color:#12234A;margin:0 0 8px">Application Received</h2>
        <p style="color:#333;margin:0 0 6px">Hi ${fullName},</p>
        <p style="color:#333;margin:0 0 6px">Thanks for applying to <strong>${job.title}</strong> at TITAN (${job.company}). We've received your application and our team will review it shortly.</p>
        <p style="color:#666;font-size:13px;margin:12px 0 0">You can check your application status anytime at the Careers page's status checker using this email address.</p>
      </div>`,
    });

    return res.status(201).json({ item: application });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to submit application', error: err.message });
  }
};

exports.checkApplicationStatus = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.trim()) {
      return res.status(400).json({ message: 'Please enter the email you applied with.' });
    }

    const applications = await JobApplication.find({ email: email.trim().toLowerCase() })
      .sort({ createdAt: -1 })
      .select('jobTitle status createdAt');

    return res.status(200).json({ items: applications });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to check application status', error: err.message });
  }
};
