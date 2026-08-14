const StudentIdCard = require('../models/StudentIdCard');
const { buildIdentifierQuery } = require('../utils/lookup');

// "Generate" here means: look up the student's card record so the frontend
// can render/export the visual ID card from it — cards themselves are
// created ahead of time by the seed/admissions process, not on request.
exports.generateIdCard = async (req, res) => {
  try {
    const identifier = req.params.identifier;
    if (!identifier || !identifier.trim()) {
      return res.status(400).json({ message: 'Enter your CNIC or card ID.' });
    }

    const query = buildIdentifierQuery(identifier, { cnicField: 'cnic', refField: 'cardId' });
    const record = await StudentIdCard.findOne(query).lean();

    if (!record) {
      return res.status(404).json({ message: 'No student ID card found for this ID.' });
    }

    return res.status(200).json({ idCard: record });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch ID card', error: err.message });
  }
};
