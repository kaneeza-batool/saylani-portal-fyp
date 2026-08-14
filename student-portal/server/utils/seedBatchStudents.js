require('dotenv').config();

const mongoose = require('mongoose');
const Student = require('../models/Student');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Quiz = require('../models/Quiz');
const {
  randInt,
  seedAttendanceForStudent,
  seedQuizAttemptsForStudent,
  seedProgressForStudent,
} = require('./seedPerformanceData');

const CAMPUS = 'Saylani TITAN Sukkur Campus';
const CITY = 'Sukkur';
const CNIC_PREFIX = '3520';
// These students can't log in (no password set — see seedOneStudent), so
// they'd never actually hit the mandatory onboarding upload screen anyway,
// but they get a placeholder avatarUrl + hasCompletedOnboarding: true here
// for consistency, and so they render properly wherever avatars show up
// (leaderboard, etc.). A generic person-silhouette placeholder — NOT the
// institute logo, which would look like the school's crest is standing in
// for a student's photo.
const PLACEHOLDER_AVATAR = '/images/avatars/default-avatar.svg';

// Matches the totals our real test student was seeded with (see
// seedAttendance.js / seedProgress.js) so "batch average" is comparing
// like-for-like curriculum sizes, not arbitrary numbers.
const WEB_DEV_TOTAL_CLASSES = 80;
const AI_DS_TOTAL_CLASSES = 40;
const WEB_DEV_TOTAL_TOPICS = 46;
const AI_DS_TOTAL_TOPICS = 71;

const FATHER_FIRST_NAMES = ['Muhammad', 'Abdul', 'Ghulam', 'Nazir', 'Rafiq', 'Zahid'];

const STUDENT_NAMES = [
  'Ahmed Raza', 'Fatima Khan', 'Bilal Hussain', 'Ayesha Siddiqui', 'Usman Tariq',
  'Sana Malik', 'Hamza Sheikh', 'Mahnoor Iqbal', 'Zeeshan Abbas', 'Rabia Farooq',
  'Kamran Aslam', 'Sadia Nawaz', 'Talha Yousaf', 'Iqra Baig', 'Fahad Chaudhry',
  'Nida Rashid', 'Waqas Ahmed', 'Hira Saleem', 'Junaid Butt', 'Amna Qureshi',
  'Shahzad Anwar', 'Mehak Riaz', 'Danish Javed', 'Sobia Akhtar',
];

// 5 excellent, 7 good, 8 average, 4 struggling — a real-feeling spread, not
// a uniform curve. Each student's Web Dev vs AI & Data Science numbers are
// rolled independently within the same profile, so nobody performs
// identically across both courses (matching how our real test student
// doesn't either).
const PROFILES = {
  excellent: { attendance: [90, 98], quiz: [85, 97], progress: [82, 98] },
  good: { attendance: [76, 89], quiz: [68, 84], progress: [55, 80] },
  average: { attendance: [58, 75], quiz: [52, 67], progress: [32, 54] },
  struggling: { attendance: [35, 57], quiz: [28, 51], progress: [10, 31] },
};

const PROFILE_DISTRIBUTION = [
  ...Array(5).fill('excellent'),
  ...Array(7).fill('good'),
  ...Array(8).fill('average'),
  ...Array(4).fill('struggling'),
];

function cnicFor(seq) {
  return `${CNIC_PREFIX}${String(seq).padStart(9, '0')}`;
}

function rollFor(prefix, seq) {
  return `${prefix}-1${String(seq).padStart(2, '0')}`;
}

async function seedOneStudent(seq, fullName, profileKey, courses, quizzesByCourse) {
  const cnic = cnicFor(seq);
  const existingStudent = await Student.findOne({ cnic });
  if (existingStudent) {
    console.log(`  [${seq}] ${fullName} already exists. Skipping.`);
    return;
  }

  const surname = fullName.split(' ').slice(-1)[0];
  const fatherName = `${FATHER_FIRST_NAMES[seq % FATHER_FIRST_NAMES.length]} ${surname}`;

  const student = await Student.create({
    fullName,
    fatherName,
    cnic,
    phone: `0300-${String(1000000 + seq).slice(-7)}`,
    gender: seq % 2 === 0 ? 'male' : 'female',
    campus: CAMPUS,
    city: CITY,
    avatarUrl: PLACEHOLDER_AVATAR,
    hasCompletedOnboarding: true,
  });

  const profile = PROFILES[profileKey];

  for (const course of courses) {
    const isWebDev = course.name === 'Web Development';
    const totalClasses = isWebDev ? WEB_DEV_TOTAL_CLASSES : AI_DS_TOTAL_CLASSES;
    const totalTopics = isWebDev ? WEB_DEV_TOTAL_TOPICS : AI_DS_TOTAL_TOPICS;
    const rollPrefix = isWebDev ? 'WD-24' : 'AIDS-25';

    const targetAttendance = randInt(...profile.attendance);
    const targetQuiz = randInt(...profile.quiz);
    const targetProgress = randInt(...profile.progress);

    await seedAttendanceForStudent(student._id, course._id, totalClasses, targetAttendance);
    await seedQuizAttemptsForStudent(student._id, quizzesByCourse[course._id.toString()], targetQuiz);
    const actualProgress = await seedProgressForStudent(student._id, course._id, targetProgress, totalTopics);

    await Enrollment.create({
      student: student._id,
      course: course._id,
      batch: isWebDev ? 'WD-Morning-B14' : 'AIDS-Evening-B05',
      rollNumber: rollFor(rollPrefix, seq),
      campus: CAMPUS,
      city: CITY,
      status: 'enrolled',
      progressPercent: actualProgress ?? 0,
      enrolledAt: new Date(),
    });
  }

  console.log(`  [${seq}] Seeded ${fullName} (${profileKey}) — enrolled in ${courses.length} courses.`);
}

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);

  const webDev = await Course.findOne({ name: 'Web Development' });
  const aiDs = await Course.findOne({ name: 'AI & Data Science' });
  if (!webDev || !aiDs) {
    console.error('Courses not found. Run "npm run seed:courses" first.');
    process.exit(1);
  }
  const courses = [webDev, aiDs];

  const quizzesByCourse = {};
  for (const course of courses) {
    quizzesByCourse[course._id.toString()] = await Quiz.find({ courseId: course._id });
  }
  if (Object.values(quizzesByCourse).some((qs) => qs.length === 0)) {
    console.error('Quizzes not found for one or both courses. Run "npm run seed:quizzes" first.');
    process.exit(1);
  }

  console.log(`Seeding ${STUDENT_NAMES.length} batch students across Web Development + AI & Data Science...`);

  for (let i = 0; i < STUDENT_NAMES.length; i += 1) {
    const seq = i + 1;
    await seedOneStudent(seq, STUDENT_NAMES[i], PROFILE_DISTRIBUTION[i], courses, quizzesByCourse);
  }

  const totalStudents = await Student.countDocuments();
  console.log(`Done. Total students in DB: ${totalStudents}.`);

  await mongoose.disconnect();
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err.message);
    process.exit(1);
  });
