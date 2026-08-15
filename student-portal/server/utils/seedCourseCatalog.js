// Minimal, idempotent seed for studentportal_courses — just the name field,
// matching the exact course-name vocabulary already used everywhere else
// in the shared database (main app's Student.COURSES / Trainer.course /
// Slot.course), so a trainer's free-text `course` on their profile lines
// up with a real course document a quiz/assignment can reference.
require('dotenv').config();
require('./fixDns');
const mongoose = require('mongoose');
const Course = require('../models/Course');

const COURSE_NAMES = [
  'Web Development',
  'AI & Data Science',
  'Graphic Designing',
  'Mobile App Development (Flutter)',
  'Digital Marketing',
  'UI/UX Design',
  'Cybersecurity Fundamentals',
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  let inserted = 0;
  for (const name of COURSE_NAMES) {
    const existing = await Course.findOne({ name });
    if (existing) continue;
    await Course.create({ name });
    inserted++;
  }
  console.log(`Inserted ${inserted} new course(s). Total: ${await Course.countDocuments()}`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seeding failed:', err.message);
  process.exit(1);
});
