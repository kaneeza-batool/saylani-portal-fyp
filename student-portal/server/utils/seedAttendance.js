require('dotenv').config();

const mongoose = require('mongoose');
const Student = require('../models/Student');
const Course = require('../models/Course');
const Attendance = require('../models/Attendance');

const STUDENT_CNIC = '4550476281307';

// Classes run Mon/Wed/Fri or Tue/Thu/Sat depending on the batch schedule.
function buildClassDates(count, weekdays) {
  const dates = [];
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  while (dates.length < count) {
    if (weekdays.includes(cursor.getDay())) dates.push(new Date(cursor));
    cursor.setDate(cursor.getDate() - 1);
  }

  return dates.reverse(); // oldest first
}

function weightedStatus(presentP, leaveP) {
  const r = Math.random();
  if (r < presentP) return 'present';
  if (r < presentP + leaveP) return 'leave';
  return 'absent';
}

async function seedCourseAttendance(student, course, opts) {
  const existingCount = await Attendance.countDocuments({ student: student._id, courseId: course._id });
  if (existingCount > 0) {
    console.log(`  ${course.name}: already has ${existingCount} attendance records. Skipping.`);
    return;
  }

  const dates = buildClassDates(opts.totalClasses, opts.weekdays);
  const records = dates.map((date, i) => {
    const classNumber = i + 1;
    const isRecent = i >= opts.totalClasses - opts.forcedPresentStreak;
    return {
      student: student._id,
      courseId: course._id,
      date,
      classNumber,
      status: isRecent ? 'present' : weightedStatus(opts.presentP, opts.leaveP),
    };
  });

  await Attendance.insertMany(records);

  const present = records.filter((r) => r.status === 'present').length;
  const leave = records.filter((r) => r.status === 'leave').length;
  const absent = records.filter((r) => r.status === 'absent').length;
  console.log(
    `  ${course.name}: seeded ${records.length} records (present=${present} leave=${leave} absent=${absent}, most recent ${opts.forcedPresentStreak} forced present).`
  );
}

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);

  const student = await Student.findOne({ cnic: STUDENT_CNIC });
  if (!student) {
    console.error(`No student found with CNIC ${STUDENT_CNIC}. Run "npm run seed" first.`);
    process.exit(1);
  }

  const webDev = await Course.findOne({ name: 'Web Development' });
  const aiDs = await Course.findOne({ name: 'AI & Data Science' });
  if (!webDev || !aiDs) {
    console.error('Courses not found. Run "npm run seed:courses" first.');
    process.exit(1);
  }

  console.log(`Seeding attendance for ${student.name}...`);

  // Web Development — Mon/Wed/Fri, longer-running (enrolled 7 months ago).
  await seedCourseAttendance(student, webDev, {
    totalClasses: 80,
    weekdays: [1, 3, 5],
    presentP: 0.85,
    leaveP: 0.08,
    forcedPresentStreak: 14, // easy 7-day-milestone demo
  });

  // AI & Data Science — Tue/Thu/Sat, shorter history (enrolled 3 months ago),
  // slightly rockier attendance than Web Development.
  await seedCourseAttendance(student, aiDs, {
    totalClasses: 40,
    weekdays: [2, 4, 6],
    presentP: 0.75,
    leaveP: 0.12,
    forcedPresentStreak: 5,
  });

  await mongoose.disconnect();
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err.message);
    process.exit(1);
  });
