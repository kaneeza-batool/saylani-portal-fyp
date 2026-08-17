// One-off migration: replaces every existing Student's random 6-digit
// rollNumber (e.g. 571697, from the old assignRollNumber hook) with the new
// course-prefixed format (e.g. "GD-014") that hook now produces for new
// students — see server/models/Student.js's COURSE_ROLL_PREFIXES.
//
// Assigned in createdAt order per course, so the earliest-registered
// student in each course gets -001, matching how a real roll number system
// reads. Computed entirely in memory in one pass (no per-document DB round
// trip for "what's the next number"), so unlike the live assignRollNumber
// hook there's no collision to retry — every value handed to bulkWrite is
// already guaranteed unique before any of them are written.
//
// Safe to re-run: it always recomputes every student's number from the same
// createdAt ordering, so a second run produces identical output, not a
// second migration on top of the first.

require('dotenv').config();
const mongoose = require('mongoose');
const Student = require('../models/Student');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);

  const students = await Student.find({}, '_id course').sort({ createdAt: 1 }).lean();
  if (students.length === 0) {
    console.log('No students found — nothing to regenerate.');
    await mongoose.disconnect();
    return;
  }

  const counters = {};
  const ops = students.map((s) => {
    const prefix = Student.COURSE_ROLL_PREFIXES[s.course] || 'ST';
    counters[prefix] = (counters[prefix] || 0) + 1;
    const rollNumber = `${prefix}-${String(counters[prefix]).padStart(3, '0')}`;
    return { updateOne: { filter: { _id: s._id }, update: { $set: { rollNumber } } } };
  });

  const result = await Student.bulkWrite(ops);
  console.log(`Regenerated roll numbers for ${ops.length} students (${result.modifiedCount} modified).`);
  for (const [prefix, count] of Object.entries(counters)) {
    console.log(`  ${prefix}: ${count} students (${prefix}-001 .. ${prefix}-${String(count).padStart(3, '0')})`);
  }

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Roll number regeneration failed:', err.message);
  process.exit(1);
});
