const mongoose = require('mongoose');

// Written automatically by server/utils/auditLogger.js whenever a core
// admin resource (Student, Campus, Trainer, Course, Employer, Sub-Admin,
// Slot, Quiz, Job) is created, updated, or deleted. Powers both the Audit
// Log page (all actions) and the Updation page (action: 'update' only).
const auditLogSchema = new mongoose.Schema(
  {
    actorName: { type: String, required: true },
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    action: { type: String, enum: ['create', 'update', 'delete'], required: true },
    resourceType: { type: String, required: true }, // e.g. 'Student', 'Campus'
    resourceId: { type: mongoose.Schema.Types.ObjectId, default: null },
    summary: { type: String, required: true }, // human-readable one-liner
    // Resolved server-side from the acting user's campus_id (see
    // auditLogger.js) — never trust a campus from the request. super_admin
    // has no campus_id, so their entries land here as null; the sub-admin
    // audit-log endpoint's campusScope filter naturally excludes those.
    campus: { type: mongoose.Schema.Types.ObjectId, ref: 'Campus', default: null, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AuditLog', auditLogSchema);
