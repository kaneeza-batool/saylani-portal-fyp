// One-off migration: every AuditLog entry written before AuditLog.campus
// existed has campus: null, purely because the field didn't exist at write
// time — not because the action was actually campus-less. This re-derives
// it using the same resolution order as live logging (see auditLogger.js):
// actor's *current* campus_id first (looked up fresh here since AuditLog
// never cached it), then the affected resource's own campus. Idempotent and
// safe to re-run: only touches entries where campus is still null, and
// leaves it null again if neither resolves (deleted resource, or a
// genuinely global resourceType like Course/Employer/Job).
require('dotenv').config();
const mongoose = require('mongoose');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');
const Student = require('../models/Student');
const Trainer = require('../models/Trainer');
const Slot = require('../models/Slot');
const Alert = require('../models/Alert');
const Quiz = require('../models/Quiz');
const TrainerAttendance = require('../models/TrainerAttendance');
const StudentAttendance = require('../models/StudentAttendance');
const AttendanceRequest = require('../models/AttendanceRequest');
const { resolveCampusIdByName } = require('./auditLogger');

// resourceType -> (resourceId) => campus ObjectId | null. Course/Employer/Job
// deliberately have no entry — they carry no campus, so their audit entries
// stay null, correctly.
const RESOURCE_CAMPUS_RESOLVERS = {
  Student: async (id) => (await Student.findById(id).select('campus').lean())?.campus || null,
  Trainer: async (id) => (await Trainer.findById(id).select('campus').lean())?.campus || null,
  Slot: async (id) => (await Slot.findById(id).select('campus').lean())?.campus || null,
  SubAdmin: async (id) => (await User.findById(id).select('campus_id').lean())?.campus_id || null,
  Campus: async (id) => id, // the resource IS the campus
  Alert: async (id) => (await Alert.findById(id).select('campus').lean())?.campus || null,
  Quiz: async (id) => {
    const q = await Quiz.findById(id).select('campus').lean();
    return q?.campus ? resolveCampusIdByName(q.campus) : null;
  },
  TrainerAttendance: async (id) => {
    const r = await TrainerAttendance.findById(id).select('campus').lean();
    return r?.campus ? resolveCampusIdByName(r.campus) : null;
  },
  StudentAttendance: async (id) => {
    const r = await StudentAttendance.findById(id).select('campus').lean();
    return r?.campus ? resolveCampusIdByName(r.campus) : null;
  },
  AttendanceRequest: async (id) => {
    const r = await AttendanceRequest.findById(id).select('campus').lean();
    return r?.campus ? resolveCampusIdByName(r.campus) : null;
  },
};

async function resolveCampusForEntry(entry) {
  if (entry.actorId) {
    const actor = await User.findById(entry.actorId).select('campus_id').lean();
    if (actor?.campus_id) return { campus: actor.campus_id, via: 'actor' };
  }
  const resolver = RESOURCE_CAMPUS_RESOLVERS[entry.resourceType];
  if (resolver && entry.resourceId) {
    const campus = await resolver(entry.resourceId);
    if (campus) return { campus, via: 'resource' };
  }
  return { campus: null, via: null };
}

async function backfill() {
  await mongoose.connect(process.env.MONGO_URI);

  const entries = await AuditLog.find({ campus: null });
  console.log(`Found ${entries.length} entries with campus: null.`);

  let resolvedViaActor = 0;
  let resolvedViaResource = 0;
  const stillNull = { noResolverForType: 0, resourceNotFound: 0 };
  const stillNullByType = {};

  for (const entry of entries) {
    const { campus, via } = await resolveCampusForEntry(entry);
    if (campus) {
      entry.campus = campus;
      await entry.save();
      if (via === 'actor') resolvedViaActor++;
      else resolvedViaResource++;
    } else {
      if (RESOURCE_CAMPUS_RESOLVERS[entry.resourceType]) {
        stillNull.resourceNotFound++;
      } else {
        stillNull.noResolverForType++;
      }
      stillNullByType[entry.resourceType] = (stillNullByType[entry.resourceType] || 0) + 1;
    }
  }

  console.log('--- Backfill results ---');
  console.log(`Resolved via actor's current campus_id: ${resolvedViaActor}`);
  console.log(`Resolved via affected resource's campus: ${resolvedViaResource}`);
  console.log(`Still null — resource deleted / lookup found nothing: ${stillNull.resourceNotFound}`);
  console.log(`Still null — resourceType has no campus concept (global resource): ${stillNull.noResolverForType}`);
  console.log(`Still-null breakdown by resourceType: ${JSON.stringify(stillNullByType)}`);
  console.log(`Total remaining null: ${stillNull.resourceNotFound + stillNull.noResolverForType}`);

  await mongoose.disconnect();
}

backfill().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
