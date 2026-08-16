const mongoose = require('mongoose');

// Read-only mirror of the main app's Slot model (student-portal's
// Student.batch refs it — see Student.js) — same reasoning as Campus.js.
// course/trainer/assignedTrainer are here so resourceController can join a
// student's batch back to the trainer+course that owns any uploaded
// Resource docs; schedule is here for display. Explicit collection name,
// matching the main app's own Slot.js exactly rather than trusting
// pluralization to agree.
const slotSchema = new mongoose.Schema({
  schedule: { type: String, trim: true },
  course: { type: String, trim: true },
  trainer: { type: String, trim: true },
  assignedTrainer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
});

module.exports = mongoose.model('Slot', slotSchema, 'slots');
