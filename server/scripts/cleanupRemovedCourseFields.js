// One-time cleanup: unsets the per-campus availability fields
// (isOnlineAvailable, registrationStatus, isOnCampus, isOnline) that were
// removed from the Course schema on 2026-08-14 (see the audit note on the
// model) but remained physically stored on existing documents. Since
// listPublicCourses/listCourses use .lean(), stale stored fields leak
// straight through regardless of the schema change — this clears them.
// Safe to re-run: $unset on an already-absent field is a no-op.
require('dotenv').config();
const mongoose = require('mongoose');

const REMOVED_FIELDS = { isOnlineAvailable: 1, registrationStatus: 1, isOnCampus: 1, isOnline: 1 };

async function cleanup() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB connected');

  const result = await mongoose.connection.collection('courses').updateMany({}, { $unset: REMOVED_FIELDS });
  console.log(`Matched ${result.matchedCount} course(s), modified ${result.modifiedCount}.`);

  await mongoose.disconnect();
}

cleanup().catch((err) => {
  console.error('Cleanup failed:', err);
  process.exit(1);
});
