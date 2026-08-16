const fs = require('fs');
const path = require('path');
const Resource = require('../models/Resource');
const Slot = require('../models/Slot');
const Student = require('../models/Student');
const StudentPortalNotification = require('../models/StudentPortalNotification');
const { myBatchesFilter } = require('./trainerDashboardController');
const { logAudit } = require('../utils/auditLogger');

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

    logAudit({
      actor: req.user,
      action: 'create',
      resourceType: 'Resource',
      resourceId: resource._id,
      summary: `Uploaded resource "${resource.title}" for ${resource.course}`,
    });

    // Notify every enrolled student in the trainer's own batch(es) for this
    // course — same batch-ownership scoping as trainerStudentsController's
    // roster query. Own try/catch so a notification failure never turns an
    // already-saved upload into a reported failure.
    try {
      const slots = await Slot.find({ ...myBatchesFilter(req.user), course }, '_id').lean();
      const slotIds = slots.map((s) => s._id);
      const students = await Student.find({ batch: { $in: slotIds }, status: { $nin: ['pending', 'rejected'] } }, '_id').lean();
      if (students.length) {
        await StudentPortalNotification.insertMany(
          students.map((s) => ({
            student: s._id,
            icon: '📎',
            title: 'New Resource Shared',
            message: `${req.user.name} shared "${resource.title}" for ${resource.course}.`,
            link: '/resources',
          }))
        );
      }
    } catch (notifyErr) {
      console.error('Failed to create resource-shared notifications:', notifyErr.message);
    }

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

    logAudit({
      actor: req.user,
      action: 'delete',
      resourceType: 'Resource',
      resourceId: resource._id,
      summary: `Deleted resource "${resource.title}" for ${resource.course}`,
    });

    return res.status(200).json({ message: 'Resource deleted.' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to delete resource', error: err.message });
  }
};
