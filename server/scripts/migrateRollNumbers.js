// Regenerates every legacy (bare-numeric or missing) student roll number into
// the schema's course-prefixed format (e.g. AI-001), and updates every
// denormalized copy (StudentAttendance.rollNumber, StudentAttendanceRequest.
// rollNumber) in the same pass. Idempotent — re-running finds no legacy
// roll numbers left and does nothing.
//
// Deliberately does NOT touch FeeVoucher.voucherId — confirmed via live
// inspection that voucherId is looked up by itself (unique index), never
// reconstructed from a student's current rollNumber, so old vouchers keep
// their original IDs safely.
//
// Usage: ATLAS_URI=<uri> node scripts/migrateRollNumbers.js [--execute]

const { MongoClient } = require('mongodb');

const COURSE_ROLL_PREFIXES = {
  'Web Development': 'WD',
  'AI & Data Science': 'AI',
  'Graphic Designing': 'GD',
  'Mobile App Development (Flutter)': 'MA',
  'Digital Marketing': 'DM',
  'UI/UX Design': 'UX',
  'Cybersecurity Fundamentals': 'CS',
};

function isFormatted(rollNumber) {
  return /^[A-Z]+-\d+$/.test(String(rollNumber || ''));
}

async function main() {
  const dryRun = process.argv[2] !== '--execute';
  const client = new MongoClient(process.env.ATLAS_URI, { serverSelectionTimeoutMS: 20000 });
  await client.connect();
  const db = client.db();
  console.log(dryRun ? '=== DRY RUN ===' : '=== EXECUTING ===');

  const students = await db.collection('students').find({}).toArray();
  console.log(`\nBefore: ${students.filter((s) => isFormatted(s.rollNumber)).length} / ${students.length} correctly formatted`);

  const legacy = students.filter((s) => !isFormatted(s.rollNumber));
  console.log(`Legacy roll numbers to migrate: ${legacy.length}`);

  // Current max suffix per prefix, seeded from whatever's already correctly formatted
  const maxByPrefix = {};
  for (const s of students) {
    if (!isFormatted(s.rollNumber)) continue;
    const m = String(s.rollNumber).match(/^([A-Z]+)-(\d+)$/);
    if (!m) continue;
    const [, prefix, numStr] = m;
    maxByPrefix[prefix] = Math.max(maxByPrefix[prefix] || 0, parseInt(numStr, 10));
  }

  // Deterministic order: by course, then by createdAt ascending (earliest-created gets the lower number)
  legacy.sort((a, b) => {
    if (a.course !== b.course) return a.course.localeCompare(b.course);
    return new Date(a.createdAt) - new Date(b.createdAt);
  });

  const plan = [];
  const usedValues = new Set(students.filter((s) => isFormatted(s.rollNumber)).map((s) => s.rollNumber));
  for (const s of legacy) {
    const prefix = COURSE_ROLL_PREFIXES[s.course] || 'ST';
    let next = (maxByPrefix[prefix] || 0) + 1;
    let newRoll = `${prefix}-${String(next).padStart(3, '0')}`;
    if (usedValues.has(newRoll)) {
      console.error(`COLLISION: ${newRoll} already exists — aborting migration for ${s.name} (${s._id}). Report only, no changes applied.`);
      continue;
    }
    maxByPrefix[prefix] = next;
    usedValues.add(newRoll);
    plan.push({ student: s, oldRoll: s.rollNumber, newRoll });
  }

  console.log(`\nMigration plan (${plan.length} students):`);
  for (const p of plan) {
    console.log(`  ${p.student.name} (${p.student._id}): "${p.oldRoll}" -> "${p.newRoll}"`);
  }

  if (plan.length !== legacy.length) {
    console.error(`\nABORTING — ${legacy.length - plan.length} collision(s) detected above. No changes were written for the full batch. Resolve and re-run.`);
    await client.close();
    process.exit(1);
  }

  if (dryRun) {
    console.log('\nDRY RUN — nothing written. Re-run with --execute to apply.');
    await client.close();
    return;
  }

  let attendanceUpdated = 0;
  let requestUpdated = 0;
  for (const p of plan) {
    await db.collection('students').updateOne({ _id: p.student._id }, { $set: { rollNumber: p.newRoll } });
    const attRes = await db.collection('studentattendances').updateMany({ student: p.student._id }, { $set: { rollNumber: p.newRoll } });
    attendanceUpdated += attRes.modifiedCount;
    const reqRes = await db.collection('studentattendancerequests').updateMany({ student: p.student._id }, { $set: { rollNumber: p.newRoll } });
    requestUpdated += reqRes.modifiedCount;
  }

  console.log(`\nStudents migrated: ${plan.length}`);
  console.log(`StudentAttendance records updated: ${attendanceUpdated}`);
  console.log(`StudentAttendanceRequest records updated: ${requestUpdated}`);

  const after = await db.collection('students').find({}).toArray();
  console.log(`\nAfter: ${after.filter((s) => isFormatted(s.rollNumber)).length} / ${after.length} correctly formatted`);

  await client.close();
  console.log('\n=== DONE ===');
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
