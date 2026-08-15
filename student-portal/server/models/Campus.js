const mongoose = require('mongoose');

// Minimal, read-only mirror of the main app's Campus model — student-portal
// never creates or writes a Campus, it only ever needs a campus's name (see
// authController.toSafeStudent) and city (see dashboardController's
// activeCourse.city fallback, now that Student.city itself doesn't exist)
// for display. The rest of the real record (country, address, phone,
// status) lives entirely on the main app's own Campus model; declaring
// those fields here too would just be unused duplication. Explicit
// collection name, not left to pluralization — main's own Campus.js has
// none either, and empirically resolves to 'campus' (not 'campuses'), so
// this is pinned to match exactly rather than trusting both sides'
// pluralize versions to agree forever.
const campusSchema = new mongoose.Schema({ name: { type: String, trim: true }, city: { type: String, trim: true } });

module.exports = mongoose.model('Campus', campusSchema, 'campus');
