const StudentIdCard = require('../models/StudentIdCard');

// Auto-generated when the admin doesn't supply one — TITAN-{year}-{4 random
// digits}, re-rolled on a rare collision rather than trusting randomness
// alone against the model's unique index.
async function generateCardId() {
  const year = new Date().getFullYear();
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = `TITAN-${year}-${Math.floor(1000 + Math.random() * 9000)}`;
    if (!(await StudentIdCard.exists({ cardId: candidate }))) return candidate;
  }
  throw new Error('Could not generate a unique card ID, please supply one manually.');
}

exports.listCards = async (req, res) => {
  try {
    const cards = await StudentIdCard.find().sort({ createdAt: -1 });
    return res.status(200).json({ cards });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch ID cards', error: err.message });
  }
};

exports.getCard = async (req, res) => {
  try {
    const card = await StudentIdCard.findById(req.params.id);
    if (!card) return res.status(404).json({ message: 'ID card not found.' });
    return res.status(200).json({ card });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch ID card', error: err.message });
  }
};

exports.createCard = async (req, res) => {
  try {
    const data = { ...req.body };
    if (!data.fullName?.trim() || !data.cnic?.trim() || !data.program?.trim() || !data.campus?.trim() || !data.validUntil) {
      return res.status(400).json({ message: 'Full name, CNIC, program, campus, and valid-until date are required.' });
    }
    if (!data.cardId?.trim()) data.cardId = await generateCardId();
    const card = await StudentIdCard.create(data);
    return res.status(201).json({ card });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'That card ID is already in use.' });
    if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
    return res.status(500).json({ message: 'Failed to create ID card', error: err.message });
  }
};

exports.updateCard = async (req, res) => {
  try {
    const card = await StudentIdCard.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!card) return res.status(404).json({ message: 'ID card not found.' });
    return res.status(200).json({ card });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'That card ID is already in use.' });
    if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
    return res.status(500).json({ message: 'Failed to update ID card', error: err.message });
  }
};

exports.deleteCard = async (req, res) => {
  try {
    const card = await StudentIdCard.findByIdAndDelete(req.params.id);
    if (!card) return res.status(404).json({ message: 'ID card not found.' });
    return res.status(200).json({ message: 'ID card deleted.' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to delete ID card', error: err.message });
  }
};
