const mongoose = require('mongoose');

// Read-only mirror of the main app's Resource model (see
// server/models/Resource.js) — trainer-uploaded files, joined against a
// student's own batch (Student.batch -> Slot.course/assignedTrainer) in
// resourceController.getResourceLibrary to decide which ones they can see.
// Explicit collection name, matching the main app's own Resource.js exactly.
const resourceSchema = new mongoose.Schema({
  title: { type: String, trim: true },
  description: { type: String, trim: true },
  fileUrl: { type: String },
  fileName: { type: String },
  fileType: { type: String, trim: true },
  course: { type: String, trim: true },
  trainer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  trainerName: { type: String, trim: true },
  createdAt: { type: Date },
});

module.exports = mongoose.model('Resource', resourceSchema, 'resources');
