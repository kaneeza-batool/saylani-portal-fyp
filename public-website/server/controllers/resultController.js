const AcademicResult = require('../models/AcademicResult');
const { buildIdentifierQuery } = require('../utils/lookup');

exports.checkResult = async (req, res) => {
  try {
    const identifier = req.params.identifier;
    if (!identifier || !identifier.trim()) {
      return res.status(400).json({ message: 'Enter your CNIC or application reference number.' });
    }

    const query = buildIdentifierQuery(identifier);
    const record = await AcademicResult.findOne(query).lean();

    if (!record) {
      return res.status(404).json({ message: 'No academic result found for this ID.' });
    }

    return res.status(200).json({ result: record });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to check result', error: err.message });
  }
};
