const AuditLog = require('../models/AuditLog');
const Campus = require('../models/Campus');
const { getIO } = require('./socket');

// Several resources (StudentAttendance, TrainerAttendance, AttendanceRequest,
// Quiz) only carry a cached campus *name* String, not an ObjectId ref (see
// each model's comment) — this resolves that name to a real Campus _id so it
// can be stored on AuditLog.campus, which is always an ObjectId. Cached in
// memory: campus names are effectively static and this runs on every
// attendance mark, so a per-call DB round trip isn't worth it.
const campusIdByName = new Map();
async function resolveCampusIdByName(name) {
  if (!name) return null;
  if (campusIdByName.has(name)) return campusIdByName.get(name);
  const campus = await Campus.findOne({ name }).select('_id').lean();
  const id = campus?._id || null;
  campusIdByName.set(name, id);
  return id;
}

// Fire-and-forget — a logging failure should never fail the underlying
// mutation, so this never throws into the caller.
//
// campus resolution order: actor.campus_id first (never trust the request
// body — actor is always the authenticated req.user), then resourceCampus —
// the affected resource's own campus, which the caller resolves server-side
// (a real ObjectId field read straight off the mutated doc, or the result of
// resolveCampusIdByName above) and passes in. This is what makes a
// super_admin's action on a campus-scoped resource (super_admin has no
// campus_id of their own) still surface to that campus's sub_admin. Only
// null when neither resolves — a genuinely global resource (Course,
// Employer, Job) or a resource whose campus lookup failed.
async function logAudit({ actor, action, resourceType, resourceId, summary, resourceCampus }) {
  try {
    const entry = await AuditLog.create({
      actorName: actor?.name || 'System',
      actorId: actor?._id || null,
      action,
      resourceType,
      resourceId: resourceId || null,
      summary,
      campus: actor?.campus_id || resourceCampus || null,
    });
    const io = getIO();
    // Same room-scoping as alertEngine.js's emitAlert — a global io.emit()
    // here would leak every campus's actor names and actions to every
    // connected socket. No campus (a global resource, or a lookup that
    // failed) goes to super-admins only, never broadcast.
    if (io) {
      const rooms = entry.campus ? [`campus:${entry.campus}`, 'super-admins'] : ['super-admins'];
      io.to(rooms).emit('audit:new', entry);
    }
  } catch (err) {
    console.error('audit log write failed:', err.message);
  }
}

module.exports = { logAudit, resolveCampusIdByName };
