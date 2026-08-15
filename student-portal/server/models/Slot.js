const mongoose = require('mongoose');

// Minimal, read-only mirror of the main app's Slot model (student-portal's
// Student.batch refs it — see Student.js) — same reasoning as Campus.js:
// this portal only ever needs a batch's schedule string for display, never
// writes a Slot. Explicit collection name, matching the main app's own
// Slot.js exactly rather than trusting pluralization to agree.
const slotSchema = new mongoose.Schema({ schedule: { type: String, trim: true } });

module.exports = mongoose.model('Slot', slotSchema, 'slots');
