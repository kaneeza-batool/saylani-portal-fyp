const ContactSubmission = require('../models/ContactSubmission');

exports.listSubmissions = async (req, res) => {
  try {
    const submissions = await ContactSubmission.find().sort({ createdAt: -1 });
    return res.status(200).json({ submissions });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch contact submissions', error: err.message });
  }
};

exports.deleteSubmission = async (req, res) => {
  try {
    const submission = await ContactSubmission.findByIdAndDelete(req.params.id);
    if (!submission) return res.status(404).json({ message: 'Submission not found.' });
    return res.status(200).json({ message: 'Submission deleted.' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to delete submission', error: err.message });
  }
};
