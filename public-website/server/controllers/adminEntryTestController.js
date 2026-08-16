const EntryTestApplicant = require('../models/EntryTestApplicant');

exports.listApplicants = async (req, res) => {
  try {
    const applicants = await EntryTestApplicant.find().sort({ createdAt: -1 });
    return res.status(200).json({ applicants });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch entry test applicants', error: err.message });
  }
};

exports.getApplicant = async (req, res) => {
  try {
    const applicant = await EntryTestApplicant.findById(req.params.id);
    if (!applicant) return res.status(404).json({ message: 'Applicant not found.' });
    return res.status(200).json({ applicant });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch applicant', error: err.message });
  }
};

exports.createApplicant = async (req, res) => {
  try {
    const data = { ...req.body };
    if (!data.fullName?.trim() || !data.cnic?.trim() || !data.referenceNumber?.trim() || !data.selectedProgram?.trim()) {
      return res.status(400).json({ message: 'Full name, CNIC, reference number, and program are required.' });
    }
    const applicant = await EntryTestApplicant.create(data);
    return res.status(201).json({ applicant });
  } catch (err) {
    if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
    return res.status(500).json({ message: 'Failed to create applicant', error: err.message });
  }
};

exports.updateApplicant = async (req, res) => {
  try {
    const applicant = await EntryTestApplicant.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!applicant) return res.status(404).json({ message: 'Applicant not found.' });
    return res.status(200).json({ applicant });
  } catch (err) {
    if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
    return res.status(500).json({ message: 'Failed to update applicant', error: err.message });
  }
};

exports.deleteApplicant = async (req, res) => {
  try {
    const applicant = await EntryTestApplicant.findByIdAndDelete(req.params.id);
    if (!applicant) return res.status(404).json({ message: 'Applicant not found.' });
    return res.status(200).json({ message: 'Applicant deleted.' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to delete applicant', error: err.message });
  }
};
