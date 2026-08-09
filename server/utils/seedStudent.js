require('dotenv').config();

const mongoose = require('mongoose');
const Student = require('../models/Student');

const SEED_STUDENT = {
  fullName: 'Ayesha Yousuf',
  fatherName: 'Muhammad Yousuf',
  cnic: '4550476281307',
  password: 'Student123!',
  phone: '0300-4561234',
  email: 'ayesha.yousuf@gmail.com',
  address: 'Sukkur, Sindh',
  gender: 'female',
  dateOfBirth: new Date('2003-05-14'),
  lastQualification: 'Intermediate',
  campus: 'Saylani TITAN Sukkur Campus',
  city: 'Sukkur',
  // Same placeholder every other seeded student gets — see
  // seedBatchStudents.js's PLACEHOLDER_AVATAR comment. Run
  // "npm run seed:clear-onboarding" afterward to punch a hole in this one
  // specific, real-login-capable account for testing the mandatory
  // onboarding upload screen (see Student model's hasCompletedOnboarding
  // comment for why the gate isn't just "avatarUrl is empty").
  avatarUrl: '/images/avatars/default-avatar.svg',
  hasCompletedOnboarding: true,
};

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);

  const existing = await Student.findOne({ cnic: SEED_STUDENT.cnic });
  if (existing) {
    // Backfill only the new onboarding fields onto an already-seeded
    // student, without touching anything they may have since edited via
    // the Profile page (phone/email/address/etc).
    if (!existing.hasCompletedOnboarding) {
      existing.avatarUrl = existing.avatarUrl || SEED_STUDENT.avatarUrl;
      existing.hasCompletedOnboarding = true;
      await existing.save();
      console.log(`Backfilled onboarding fields onto existing student: ${existing.fullName}.`);
    } else {
      console.log(`Student with CNIC ${SEED_STUDENT.cnic} already exists (${existing.fullName}). Skipping.`);
    }
  } else {
    const student = await Student.create(SEED_STUDENT);
    console.log(`Seeded student: ${student.fullName} (CNIC: ${student.cnic})`);
  }

  await mongoose.disconnect();
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err.message);
    process.exit(1);
  });
