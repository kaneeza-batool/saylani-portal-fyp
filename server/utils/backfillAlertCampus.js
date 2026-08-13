// One-off migration for Alert.campus, added alongside the field itself.
// Idempotent: only touches alerts missing `campus` (the field is now
// `required: true` on new writes, but that doesn't retroactively validate
// documents already in the collection). Resolved from each alert's own
// student record — never guessed.
require('dotenv').config();
const mongoose = require('mongoose');
const Alert = require('../models/Alert');
require('../models/Student');

async function main() {
  await mongoose.connect(process.env.MONGO_URI);

  const alerts = await Alert.find({ campus: { $exists: false } }).populate('student', 'campus name');

  let updated = 0;
  const orphaned = [];

  for (const alert of alerts) {
    if (!alert.student?.campus) {
      orphaned.push({ id: String(alert._id), studentName: alert.studentName, studentId: String(alert.student?._id || alert.get('student')) });
      continue;
    }
    alert.campus = alert.student.campus;
    await alert.save();
    updated++;
  }

  console.log('--- Alert.campus backfill results ---');
  console.log(`Alerts missing campus before this run: ${alerts.length}`);
  console.log(`Updated: ${updated}`);
  console.log(`Orphaned (student record missing/has no campus — could not resolve): ${orphaned.length}`);
  if (orphaned.length) console.log(JSON.stringify(orphaned, null, 2));
  console.log(`Total Alert docs: ${await Alert.countDocuments()}`);
  console.log(`Alert docs still missing campus: ${await Alert.countDocuments({ campus: { $exists: false } })}`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Alert.campus backfill failed:', err);
  process.exit(1);
});
