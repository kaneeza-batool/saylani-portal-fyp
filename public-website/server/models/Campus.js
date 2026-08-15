const mongoose = require('mongoose');

// Minimal, read-only mirror of the main app's Campus model (see
// student-portal/server/models/Campus.js — same reasoning): this app never
// creates or writes a Campus, it only needs the list (name + city) to
// populate the enrollment form's campus picker. Explicit collection name,
// not left to pluralization — main's own Campus.js has none either, and
// empirically resolves to 'campus' (not 'campuses').
const campusSchema = new mongoose.Schema({ name: { type: String, trim: true }, city: { type: String, trim: true } });

module.exports = mongoose.model('Campus', campusSchema, 'campus');
