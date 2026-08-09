require('dotenv').config();

// Proves the leaderboard is genuinely live: adds exactly ONE more student
// with a deliberately dominant score, on top of whatever seedBatchStudents.js
// already seeded. Re-querying GET /api/leaderboard/:courseId afterward (no
// server restart, no cache to bust) must show this student at #1 — if it
// doesn't, something in computeCourseLeaderboard stopped being live.

const mongoose = require('mongoose');
const Student = require('../models/Student');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Quiz = require('../models/Quiz');
const {
  seedAttendanceForStudent,
  seedQuizAttemptsForStudent,
  seedProgressForStudent,
} = require('./seedPerformanceData');

const CAMPUS = 'Saylani TITAN Sukkur Campus';
const CITY = 'Sukkur';
const CNIC = '3520000000025';
const FULL_NAME = 'Areeb Sultan';
// See seedBatchStudents.js's PLACEHOLDER_AVATAR comment — same reasoning.
const PLACEHOLDER_AVATAR = '/images/avatars/default-avatar.svg';

const WEB_DEV_TOTAL_CLASSES = 80;
const AI_DS_TOTAL_CLASSES = 40;
const WEB_DEV_TOTAL_TOPICS = 46;
const AI_DS_TOTAL_TOPICS = 71;

// jitterRange: 0 on the quiz target means every quiz attempt lands at
// exactly this score, not a random draw near it — this student's #1 spot
// has to be guaranteed, not just probable. 99/99 comfortably beats even the
// best-case "excellent" profile from seedBatchStudents.js (max 98/97).
const TARGET_ATTENDANCE = 99;
const TARGET_QUIZ = 99;
const TARGET_PROGRESS = 99;

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);

  const existing = await Student.findOne({ cnic: CNIC });
  if (existing) {
    console.log(`${FULL_NAME} already exists. Skipping.`);
    await mongoose.disconnect();
    return;
  }

  const webDev = await Course.findOne({ name: 'Web Development' });
  const aiDs = await Course.findOne({ name: 'AI & Data Science' });
  if (!webDev || !aiDs) {
    console.error('Courses not found. Run "npm run seed:courses" first.');
    process.exit(1);
  }
  const courses = [webDev, aiDs];

  const student = await Student.create({
    fullName: FULL_NAME,
    fatherName: 'Sultan Mahmood',
    cnic: CNIC,
    phone: '0300-9998887',
    gender: 'male',
    campus: CAMPUS,
    city: CITY,
    avatarUrl: PLACEHOLDER_AVATAR,
    hasCompletedOnboarding: true,
  });

  for (const course of courses) {
    const isWebDev = course.name === 'Web Development';
    const totalClasses = isWebDev ? WEB_DEV_TOTAL_CLASSES : AI_DS_TOTAL_CLASSES;
    const totalTopics = isWebDev ? WEB_DEV_TOTAL_TOPICS : AI_DS_TOTAL_TOPICS;
    const rollPrefix = isWebDev ? 'WD-24' : 'AIDS-25';
    const quizzes = await Quiz.find({ courseId: course._id });

    await seedAttendanceForStudent(student._id, course._id, totalClasses, TARGET_ATTENDANCE);
    await seedQuizAttemptsForStudent(student._id, quizzes, TARGET_QUIZ, 0);
    const actualProgress = await seedProgressForStudent(student._id, course._id, TARGET_PROGRESS, totalTopics);

    await Enrollment.create({
      student: student._id,
      course: course._id,
      batch: isWebDev ? 'WD-Morning-B14' : 'AIDS-Evening-B05',
      rollNumber: `${rollPrefix}-199`,
      campus: CAMPUS,
      city: CITY,
      status: 'enrolled',
      progressPercent: actualProgress ?? 0,
      enrolledAt: new Date(),
    });
  }

  const totalStudents = await Student.countDocuments();
  console.log(`Seeded champion student: ${FULL_NAME} (CNIC ${CNIC}). Total students in DB: ${totalStudents}.`);

  await mongoose.disconnect();
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err.message);
    process.exit(1);
  });
