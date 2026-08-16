const fs = require('fs');
const path = require('path');
const Slot = require('../models/Slot');
const { toSafeStudent } = require('./authController');

// fullName/fatherName/campus/cnic/courses are staff-managed (set at
// admission), not student-editable — cnic especially, since it's the
// login identifier.
const EDITABLE_FIELDS = ['phone', 'email', 'address', 'gender', 'dateOfBirth', 'lastQualification'];

// Simplification: avatars are written straight to the client's public
// folder and served as static files by Vite, since Cloudinary (or any
// object storage) isn't wired up yet. Revisit once one is.
const AVATAR_DIR = path.join(__dirname, '..', '..', 'client', 'public', 'images', 'avatars');
const MIME_EXT = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/webp': 'webp' };
const MAX_AVATAR_BYTES = 4 * 1024 * 1024;

exports.getProfile = async (req, res) => {
  return res.status(200).json({ student: toSafeStudent(req.student) });
};

// A student's own batch (Student.batch -> Slot) IS their trainer link —
// this was previously never surfaced to the frontend at all (login/profile
// responses stopped at course/campus), so the portal never actually showed
// who a student's trainer was even though the data existed. `trainer` is
// the free-text display name (always present, same field Trainer Portal's
// own ownership checks fall back to — see myBatchesFilter in the main
// app's trainerDashboardController.js), not the assignedTrainer ObjectId,
// which isn't always set.
exports.getMyTrainer = async (req, res) => {
  try {
    if (!req.student.batch) {
      return res.status(200).json({ trainer: null });
    }
    const slot = await Slot.findById(req.student.batch).select('trainer course schedule').lean();
    if (!slot) return res.status(200).json({ trainer: null });

    return res.status(200).json({
      trainer: { name: slot.trainer || null, course: slot.course || null, schedule: slot.schedule || null },
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load trainer info', error: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    for (const field of EDITABLE_FIELDS) {
      if (req.body[field] !== undefined) req.student[field] = req.body[field];
    }
    await req.student.save();
    return res.status(200).json({ student: toSafeStudent(req.student) });
  } catch (err) {
    if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
    return res.status(500).json({ message: 'Failed to update profile', error: err.message });
  }
};

// Lets a student through the mandatory onboarding gate without a photo —
// sets the same flag uploadAvatar does, just without writing avatarUrl.
// They can still add one later from Profile (see ProfilePage.jsx).
exports.skipOnboarding = async (req, res) => {
  try {
    req.student.hasCompletedOnboarding = true;
    await req.student.save();
    return res.status(200).json({ student: toSafeStudent(req.student) });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to skip onboarding', error: err.message });
  }
};

exports.uploadAvatar = async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) return res.status(400).json({ message: 'imageBase64 is required' });

    const match = imageBase64.match(/^data:(image\/(?:png|jpeg|jpg|webp));base64,(.+)$/);
    if (!match) return res.status(400).json({ message: 'Unsupported image format. Use PNG, JPEG, or WEBP.' });

    const ext = MIME_EXT[match[1]];
    const buffer = Buffer.from(match[2], 'base64');
    if (buffer.length > MAX_AVATAR_BYTES) {
      return res.status(400).json({ message: 'Image too large (max 4MB).' });
    }

    fs.mkdirSync(AVATAR_DIR, { recursive: true });
    const filename = `${req.student._id}-${Date.now()}.${ext}`;
    fs.writeFileSync(path.join(AVATAR_DIR, filename), buffer);

    req.student.avatarUrl = `/images/avatars/${filename}`;
    req.student.hasCompletedOnboarding = true;
    await req.student.save();

    return res.status(200).json({ student: toSafeStudent(req.student) });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to upload avatar', error: err.message });
  }
};
