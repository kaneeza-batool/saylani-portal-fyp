const fs = require('fs');
const path = require('path');
const Resource = require('../models/Resource');
const Slot = require('../models/Slot');
const { myBatchesFilter } = require('./trainerDashboardController');

// Same ownership boundary as attendance/roster scoping — a course a trainer
// doesn't actually have an active batch for isn't one they can upload into,
// even if they type the exact right name.
async function ownsCourse(user, course) {
  const count = await Slot.countDocuments({ ...myBatchesFilter(user), course });
  return count > 0;
}

exports.uploadResource = async (req, res) => {
  try {
    const { title, description, course } = req.body;
    if (!title || !course) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(400).json({ message: 'title and course are required.' });
    }
    if (!req.file) return res.status(400).json({ message: 'A file is required.' });

    if (!(await ownsCourse(req.user, course))) {
      fs.unlink(req.file.path, () => {});
      return res.status(403).json({ message: 'You can only upload resources for your own courses.' });
    }

    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/resources/${req.file.filename}`;

    const resource = await Resource.create({
      title: title.trim(),
      description: (description || '').trim(),
      fileUrl,
      fileName: req.file.originalname,
      fileType: path.extname(req.file.originalname).replace('.', '').toLowerCase(),
      course,
      trainer: req.user._id,
      trainerName: req.user.name,
    });

    return res.status(201).json({ item: resource });
  } catch (err) {
    if (req.file) fs.unlink(req.file.path, () => {});
    return res.status(500).json({ message: 'Failed to upload resource', error: err.message });
  }
};

exports.listMyResources = async (req, res) => {
  try {
    const items = await Resource.find({ trainer: req.user._id }).sort({ createdAt: -1 }).lean();
    return res.status(200).json({ items });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load resources', error: err.message });
  }
};

exports.deleteResource = async (req, res) => {
  try {
    const resource = await Resource.findOne({ _id: req.params.id, trainer: req.user._id });
    if (!resource) return res.status(404).json({ message: 'Resource not found.' });

    const filename = resource.fileUrl.split('/').pop();
    const filePath = path.join(__dirname, '..', 'uploads', 'resources', filename);
    fs.unlink(filePath, () => {});

    await resource.deleteOne();
    return res.status(200).json({ message: 'Resource deleted.' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to delete resource', error: err.message });
  }
};
