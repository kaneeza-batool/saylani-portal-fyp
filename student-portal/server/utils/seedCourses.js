require('dotenv').config();
require('./fixDns');

const mongoose = require('mongoose');
const Student = require('../models/Student');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');

const STUDENT_CNIC = '4550476281307';
const CAMPUS = 'Saylani TITAN Sukkur Campus';
const CITY = 'Sukkur';

function monthsAgo(n) {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d;
}

// progressPercent here matches the weighted CourseModule calc that
// seedProgress.js produces for each course — see that script's comments.
// classDays matches each course's seedAttendance.js weekday pattern.
const COURSES = [
  {
    name: 'Web Development',
    category: 'Web Development',
    durationWeeks: 24,
    classDays: ['Mon', 'Wed', 'Fri'],
    enrollment: {
      batch: 'WD-Morning-B14',
      rollNumber: 'WD-24-014',
      status: 'enrolled',
      progressPercent: 67,
      enrolledAt: monthsAgo(7),
    },
  },
  {
    name: 'AI & Data Science',
    category: 'Data Science & AI',
    durationWeeks: 36,
    classDays: ['Tue', 'Thu', 'Sat'],
    enrollment: {
      batch: 'AIDS-Evening-B05',
      rollNumber: 'AIDS-25-005',
      status: 'enrolled',
      progressPercent: 65,
      enrolledAt: monthsAgo(3),
    },
  },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);

  const student = await Student.findOne({ cnic: STUDENT_CNIC });
  if (!student) {
    console.error(`No student found with CNIC ${STUDENT_CNIC}. Run "npm run seed" first.`);
    process.exit(1);
  }

  for (const item of COURSES) {
    let course = await Course.findOne({ name: item.name });
    const courseFields = {
      category: item.category,
      durationWeeks: item.durationWeeks,
      classDays: item.classDays,
    };
    if (!course) {
      course = await Course.create({ name: item.name, ...courseFields });
      console.log(`Created course: ${course.name}`);
    } else {
      // Upsert-style update so re-running this script backfills new Course
      // fields (like classDays) onto a course that already exists.
      Object.assign(course, courseFields);
      await course.save();
      console.log(`Course already exists (fields refreshed): ${course.name}`);
    }

    const existingEnrollment = await Enrollment.findOne({ student: student._id, course: course._id });
    if (existingEnrollment) {
      console.log(`  Already enrolled in ${course.name}. Skipping enrollment.`);
      continue;
    }

    await Enrollment.create({
      student: student._id,
      course: course._id,
      batch: item.enrollment.batch,
      rollNumber: item.enrollment.rollNumber,
      campus: CAMPUS,
      city: CITY,
      status: item.enrollment.status,
      progressPercent: item.enrollment.progressPercent,
      enrolledAt: item.enrollment.enrolledAt,
    });
    console.log(`  Enrolled ${student.name} in ${course.name} (roll ${item.enrollment.rollNumber}).`);
  }

  await mongoose.disconnect();
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err.message);
    process.exit(1);
  });
