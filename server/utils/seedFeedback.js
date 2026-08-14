// Idempotent demo feedback: one Feedback per enrolled, batch-assigned
// student (Feedback.batch is required, so students the Task A backfill
// couldn't place in a batch are skipped, not force-fed a fake one).
//
// Ratings aren't uniform — each trainer is assigned a deterministic "tier"
// (index mod 3) so trainer averages genuinely differ: tier 0 skews
// 4s/5s, tier 1 is mixed 3s/4s, tier 2 skews 2s/3s. Comments are picked
// from a small hand-written pool matched to the rating, not lorem ipsum.
//
// Safe to re-run: skips any student who already has a Feedback doc.
require('dotenv').config();
const mongoose = require('mongoose');
const Student = require('../models/Student');
const Feedback = require('../models/Feedback');
require('../models/Slot');

const COMMENTS = {
  5: [
    'Excellent teaching, explains every concept clearly.',
    'Best instructor I have had in this program so far.',
    'Very patient, walks through examples step by step.',
    'Made a genuinely difficult topic easy to follow.',
  ],
  4: [
    'Good pace overall, explains most things well.',
    'Solid teaching — could use a few more practice exercises.',
    'Clear and organized, though a couple of sessions felt rushed.',
    'Helpful and approachable even outside class hours.',
  ],
  3: [
    'Teaching is okay but the pace is inconsistent.',
    'Sometimes hard to follow — could use more examples.',
    'An average session, could be more engaging.',
    'Explanations are fine but assignment instructions are unclear.',
  ],
  2: [
    'Lessons move too fast, hard to keep up with the material.',
    'Needs to explain core concepts more clearly before moving on.',
    'Not enough practical/hands-on examples given.',
    'Sessions feel disorganized and hard to follow at times.',
  ],
};

const RATING_TIERS = [
  [5, 4, 5, 5, 4, 5, 4, 5], // tier 0 — strong trainer
  [4, 3, 4, 3, 3, 4, 5, 3], // tier 1 — mixed
  [3, 2, 3, 2, 3, 2, 4, 2], // tier 2 — weaker trainer
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);

  const students = await Student.find({ status: 'enrolled', batch: { $exists: true, $ne: null } })
    .populate('batch', 'trainer')
    .sort({ _id: 1 });

  // Deterministic tier per trainer name, stable across runs and independent
  // of student iteration order.
  const trainerNames = [...new Set(students.map((s) => s.batch?.trainer).filter(Boolean))].sort();
  const tierByTrainer = new Map(trainerNames.map((name, i) => [name, i % 3]));

  let inserted = 0;
  let skippedExisting = 0;
  let skippedNoBatch = 0;

  for (const [i, student] of students.entries()) {
    if (!student.batch?.trainer) {
      skippedNoBatch++;
      continue;
    }

    const existing = await Feedback.findOne({ student: student._id });
    if (existing) {
      skippedExisting++;
      continue;
    }

    const trainerName = student.batch.trainer;
    const tier = tierByTrainer.get(trainerName) ?? 1;
    const pool = RATING_TIERS[tier];
    const rating = pool[i % pool.length];
    const comment = COMMENTS[rating][i % COMMENTS[rating].length];

    await Feedback.create({
      student: student._id,
      batch: student.batch._id,
      trainer: trainerName,
      campus: student.campus,
      rating,
      comment,
    });
    inserted++;
  }

  console.log('--- Feedback seed results ---');
  console.log(`Inserted: ${inserted}`);
  console.log(`Skipped — already had feedback: ${skippedExisting}`);
  console.log(`Skipped — enrolled but no batch assigned: ${skippedNoBatch}`);
  console.log(`Trainer tiers: ${JSON.stringify(Object.fromEntries(tierByTrainer))}`);
  console.log(`Total Feedback docs: ${await Feedback.countDocuments()}`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Feedback seeding failed:', err);
  process.exit(1);
});
