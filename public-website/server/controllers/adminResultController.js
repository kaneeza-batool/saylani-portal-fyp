const AcademicResult = require('../models/AcademicResult');

exports.listResults = async (req, res) => {
  try {
    const results = await AcademicResult.find().sort({ createdAt: -1 });
    return res.status(200).json({ results });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch academic results', error: err.message });
  }
};

exports.getResult = async (req, res) => {
  try {
    const result = await AcademicResult.findById(req.params.id);
    if (!result) return res.status(404).json({ message: 'Result not found.' });
    return res.status(200).json({ result });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch result', error: err.message });
  }
};

exports.createResult = async (req, res) => {
  try {
    const data = { ...req.body };
    if (!data.fullName?.trim() || !data.cnic?.trim() || !data.referenceNumber?.trim() || !data.selectedProgram?.trim() || !data.examName?.trim()) {
      return res.status(400).json({ message: 'Full name, CNIC, reference number, program, and exam name are required.' });
    }
    const result = await AcademicResult.create(data);
    return res.status(201).json({ result });
  } catch (err) {
    if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
    return res.status(500).json({ message: 'Failed to create result', error: err.message });
  }
};

exports.updateResult = async (req, res) => {
  try {
    const result = await AcademicResult.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!result) return res.status(404).json({ message: 'Result not found.' });
    return res.status(200).json({ result });
  } catch (err) {
    if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
    return res.status(500).json({ message: 'Failed to update result', error: err.message });
  }
};

exports.deleteResult = async (req, res) => {
  try {
    const result = await AcademicResult.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ message: 'Result not found.' });
    return res.status(200).json({ message: 'Result deleted.' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to delete result', error: err.message });
  }
};
