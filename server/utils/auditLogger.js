const AuditLog = require('../models/AuditLog');

// Fire-and-forget — a logging failure should never fail the underlying
// mutation, so this never throws into the caller.
async function logAudit({ actor, action, resourceType, resourceId, summary }) {
  try {
    await AuditLog.create({
      actorName: actor?.name || 'System',
      actorId: actor?._id || null,
      action,
      resourceType,
      resourceId: resourceId || null,
      summary,
    });
  } catch (err) {
    console.error('audit log write failed:', err.message);
  }
}

module.exports = { logAudit };
