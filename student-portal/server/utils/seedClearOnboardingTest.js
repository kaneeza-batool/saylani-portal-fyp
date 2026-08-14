require('dotenv').config();

// Deliberately punches a hole in the "everyone already has a placeholder
// avatar" baseline from seedStudent.js — clears avatarUrl and
// hasCompletedOnboarding back to their unset state on our one real,
// login-capable test student, so the mandatory onboarding upload screen
// (OnboardingPage / ProtectedRoute) has something real to test against.
// Run "npm run seed" (or re-login) afterward to restore normal access once
// you're done testing it, by completing the upload flow itself.

const mongoose = require('mongoose');
const Student = require('../models/Student');

const STUDENT_CNIC = '4550476281307';

async function run() {
  await mongoose.connect(process.env.MONGO_URI);

  const student = await Student.findOne({ cnic: STUDENT_CNIC });
  if (!student) {
    console.error(`No student found with CNIC ${STUDENT_CNIC}. Run "npm run seed" first.`);
    process.exit(1);
  }

  student.avatarUrl = '';
  student.hasCompletedOnboarding = false;
  await student.save();

  console.log(`Cleared avatarUrl + hasCompletedOnboarding for ${student.fullName} — next login will hit /onboarding.`);

  await mongoose.disconnect();
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Failed:', err.message);
    process.exit(1);
  });
