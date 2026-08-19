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

    // Best-effort only: the submission is already saved at this point, so a
    // mail-server hiccup here must not turn into a 500 that tells the
    // visitor their message failed to send when it actually succeeded.
    try {
      await sendContactConfirmation(submission.email, submission.name, submission.subject);
    } catch (err) {
      console.error('Contact confirmation email failed to send — submission was still saved:', err.message);
    }

    return res.status(201).json({ submission });
  } catch (err) {
    if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
    return res.status(500).json({ message: 'Failed to submit message', error: err.message });
  }
};
