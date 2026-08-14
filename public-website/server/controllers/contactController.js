const ContactSubmission = require('../models/ContactSubmission');
const { sendContactConfirmation } = require('../utils/mailer');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

exports.submitContact = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !name.trim()) return res.status(400).json({ message: 'Name is required' });
    if (!email || !EMAIL_RE.test(email)) return res.status(400).json({ message: 'A valid email is required' });
    if (!subject || !subject.trim()) return res.status(400).json({ message: 'Subject is required' });
    if (!message || !message.trim()) return res.status(400).json({ message: 'Message is required' });

    const submission = await ContactSubmission.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject.trim(),
      message: message.trim(),
    });

    await sendContactConfirmation(submission.email, submission.name, submission.subject);

    return res.status(201).json({ submission });
  } catch (err) {
    if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
    return res.status(500).json({ message: 'Failed to submit message', error: err.message });
  }
};
