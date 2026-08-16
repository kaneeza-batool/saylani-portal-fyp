// One-off migration for Student.batch, added alongside the field itself.
// Idempotent: only touches students that (a) are actual roster members —
// not 'pending'/'rejected' applicants, who were never placed in a batch —
// and (b) don't already have a batch set. A student left unassigned this
// run (no matching-course Slot in their campus yet) is picked up
// automatically on a future run once a matching Slot exists, since it's
// still missing `batch`.
//
// Match rule: course + campus. Where a campus has more than one Slot for
// the same course, students are distributed round-robin across them
// instead of all landing on one. Where a student's course has zero Slots
// in their own campus, they're left unassigned and reported — never guessed.
require('dotenv').config();
const mongoose = require('mongoose');
const Student = require('../models/Student');
const Slot = require('../models/Slot');

const ROSTER_STATUSES = ['enrolled', 'completed', 'dropout'];

async function main() {
  await mongoose.connect(process.env.MONGO_URI);

  // Only active slots — an inactive/retired Slot never surfaces to its own
  // trainer either (see trainerDashboardController.myBatchesFilter, which
  // filters status:'active'), so assigning a student there would make them
  // invisible everywhere, not just to a different trainer.
  const slots = await Slot.find({ status: 'active' }, 'course campus').lean();
  const slotsByKey = new Map(); // `${campusId}|${course}` -> [slotId, ...]
  for (const s of slots) {
    const key = `${s.campus}|${s.course}`;
    if (!slotsByKey.has(key)) slotsByKey.set(key, []);
    slotsByKey.get(key).push(s._id);
  }

  const alreadyAssigned = await Student.countDocuments({
    status: { $in: ROSTER_STATUSES },
    batch: { $exists: true, $ne: null },
  });
  const skippedApplicants = await Student.countDocuments({ status: { $in: ['pending', 'rejected'] } });

  // { $exists: false } alone misses records where batch was explicitly set
  // to null (rather than never set at all) — both mean "unassigned" here.
  const candidates = await Student.find(
    { status: { $in: ROSTER_STATUSES }, $or: [{ batch: { $exists: false } }, { batch: null }] },
    'name cnic course campus status'
  );

  const nextIndex = new Map(); // key -> round-robin cursor
  const unassigned = [];
  let assigned = 0;

  for (const student of candidates) {
    const key = `${student.campus}|${student.course}`;
    const pool = slotsByKey.get(key);
    if (!pool || pool.length === 0) {
      unassigned.push({
        id: String(student._id),
        name: student.name,
        cnic: student.cnic,
        course: student.course,
        campus: String(student.campus),
        status: student.status,
      });
      continue;
    }
    const idx = (nextIndex.get(key) ?? 0) % pool.length;
    nextIndex.set(key, idx + 1);
    student.batch = pool[idx];
    await student.save();
    assigned++;
  }

  console.log('--- Backfill results ---');
  console.log(`Already had a batch before this run (skipped, idempotent): ${alreadyAssigned}`);
  console.log(`Skipped — pending/rejected applicants, not roster members: ${skippedApplicants}`);
  console.log(`Newly assigned this run: ${assigned}`);
  console.log(`Could not confidently assign (no matching-course Slot in their campus): ${unassigned.length}`);
  if (unassigned.length) {
    console.log(JSON.stringify(unassigned, null, 2));
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
