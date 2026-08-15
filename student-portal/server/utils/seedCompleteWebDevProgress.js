require('dotenv').config();

const mongoose = require('mongoose');
const Student = require('../models/Student');
const Course = require('../models/Course');
const CourseModule = require('../models/CourseModule');
const Enrollment = require('../models/Enrollment');
const Quiz = require('../models/Quiz');
const { seedQuizAttemptsForStudent } = require('./seedPerformanceData');

const STUDENT_CNIC = '4550476281307';
// A finished-course student would plausibly have taken the course's
// quizzes along the way, not just completed every topic — without this,
// quizAverage (and therefore the certificate's finalGrade) would read 0
// purely because this student's Web Dev quiz history was never seeded,
// not because they actually performed poorly.
const TARGET_QUIZ_PERCENT = 88;

// Bumps Web Development to 100% complete for the main test student, so the
// new Certificate feature has something real to auto-generate against
// immediately. seedProgress.js's own modules are idempotent (skip if
// CourseModule docs already exist for the student+course), so this is a
// separate one-off migration over the EXISTING seeded modules rather than
// a rerun of that script — it directly flips every remaining topic to
// completed instead.
async function seed() {
  await mongoose.connect(process.env.MONGO_URI);

  const student = await Student.findOne({ cnic: STUDENT_CNIC });
  if (!student) {
    console.error(`No student found with CNIC ${STUDENT_CNIC}. Run "npm run seed" first.`);
    process.exit(1);
  }

  const webDev = await Course.findOne({ name: 'Web Development' });
  if (!webDev) {
    console.error('Web Development course not found. Run "npm run seed:courses" first.');
    process.exit(1);
  }

  const modules = await CourseModule.find({ student: student._id, courseId: webDev._id });
  if (modules.length === 0) {
    console.error('No CourseModule records found. Run "npm run seed:progress" first.');
    process.exit(1);
  }

  let flipped = 0;
  for (const mod of modules) {
    for (const t of mod.topics) {
      if (!t.isCompleted) {
        t.isCompleted = true;
        flipped += 1;
      }
    }
    await mod.save();
  }

  // Keep Enrollment's denormalized progressPercent cache in sync — see the
  // "if that ever changes, recompute it" note on the Enrollment model.
  const result = await Enrollment.findOneAndUpdate(
    { student: student._id, course: webDev._id },
    { progressPercent: 100 },
    { new: true }
  );

  console.log(
    `Web Development: marked ${flipped} remaining topic(s) complete across ${modules.length} modules (now 100%).`
  );
  console.log(`Enrollment.progressPercent synced to ${result?.progressPercent ?? 'N/A'}.`);

  const quizzes = await Quiz.find({ courseId: webDev._id });
  const quizAvg = await seedQuizAttemptsForStudent(student._id, quizzes, TARGET_QUIZ_PERCENT);
  console.log(
    quizAvg === null
      ? 'Web Dev quiz attempts already exist for this student. Skipping.'
      : `Seeded Web Dev quiz attempts — achieved average ${quizAvg}%.`
  );

  await mongoose.disconnect();
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err.message);
    process.exit(1);
  });
