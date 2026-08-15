const mongoose = require('mongoose');

// Minimal, read-only mirror of the main app's Trainer model — same
// reasoning as Campus.js/Slot.js: student-portal never creates or writes a
// Trainer, it only needs a trainer's name and course to attribute
// Ask-a-Doubt answers (see Answer.js's authorModelName/authorRole and
// seedDoubts.js). Explicit collection name, matching the main app's own
// Trainer.js exactly rather than trusting pluralization to agree.
const trainerSchema = new mongoose.Schema({ name: { type: String, trim: true }, course: { type: String, trim: true } });

module.exports = mongoose.model('Trainer', trainerSchema, 'trainers');
