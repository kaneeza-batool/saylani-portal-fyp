const EntryTestApplicant = require('../models/EntryTestApplicant');
const { buildIdentifierQuery } = require('../utils/lookup');

exports.checkEntryTestStatus = async (req, res) => {
  try {
    const identifier = req.params.identifier;
    if (!identifier || !identifier.trim()) {
      return res.status(400).json({ message: 'Enter your CNIC or application reference number.' });
    }

    const query = buildIdentifierQuery(identifier);
    const record = await EntryTestApplicant.findOne(query).lean();

    if (!record) {
      return res.status(404).json({ message: 'No entry test record found for this ID.' });
    }

    return res.status(200).json({ entryTest: record });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to check entry test status', error: err.message });
  }
};
