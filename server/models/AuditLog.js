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
  },
  { timestamps: true }
);

module.exports = mongoose.model('AuditLog', auditLogSchema);
