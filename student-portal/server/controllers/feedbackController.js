const fs = require('fs');
const path = require('path');
const Feedback = require('../models/Feedback');

// Same simplification as studentController's avatar upload — written straight
// to the client's public folder and served as a static file, since object
// storage isn't wired up yet. No admin-facing view of these exists yet
// either; this just needs to persist real records that could power one later.
const FEEDBACK_IMAGE_DIR = path.join(__dirname, '..', '..', 'client', 'public', 'images', 'feedback');
const MIME_EXT = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/webp': 'webp' };
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

exports.submitFeedback = async (req, res) => {
  try {
    const { type, text, imageBase64 } = req.body;

    if (!Feedback.TYPES.includes(type)) {
      return res.status(400).json({ message: 'A valid feedback type is required' });
    }
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Feedback text is required' });
    }

    let imageUrl = '';
    if (imageBase64) {
      const match = imageBase64.match(/^data:(image\/(?:png|jpeg|jpg|webp));base64,(.+)$/);
      if (!match) return res.status(400).json({ message: 'Unsupported image format. Use PNG, JPEG, or WEBP.' });

      const ext = MIME_EXT[match[1]];
      const buffer = Buffer.from(match[2], 'base64');
      if (buffer.length > MAX_IMAGE_BYTES) {
        return res.status(400).json({ message: 'Image too large (max 4MB).' });
      }

      fs.mkdirSync(FEEDBACK_IMAGE_DIR, { recursive: true });
      const filename = `${req.student._id}-${Date.now()}.${ext}`;
      fs.writeFileSync(path.join(FEEDBACK_IMAGE_DIR, filename), buffer);
      imageUrl = `/images/feedback/${filename}`;
    }

    const feedback = await Feedback.create({
      student: req.student._id,
      type,
      text: text.trim(),
      imageUrl,
    });

    return res.status(201).json({ feedback });
  } catch (err) {
    if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
    return res.status(500).json({ message: 'Failed to submit feedback', error: err.message });
  }
};

// Every record's status reads "Submitted" for now — there's no Super Admin
// portal connected yet to review/triage these, so nothing ever transitions
// a record past that. Once that review flow exists, this should read a
// real status field (e.g. reviewed/actioned) instead of a hardcoded label.
exports.getMyFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.find({ student: req.student._id }).sort({ createdAt: -1 });
    return res.status(200).json({
      feedback: feedback.map((f) => ({
        _id: f._id,
        type: f.type,
        text: f.text,
        imageUrl: f.imageUrl,
        status: 'Submitted',
        createdAt: f.createdAt,
      })),
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load feedback history', error: err.message });
  }
};
