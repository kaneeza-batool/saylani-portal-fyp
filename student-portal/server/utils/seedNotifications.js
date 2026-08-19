require('dotenv').config();

const mongoose = require('mongoose');
const Student = require('../models/Student');
const Notification = require('../models/Notification');

const STUDENT_CNIC = '4550476281307';

function hoursAgo(n) {
  return new Date(Date.now() - n * 60 * 60 * 1000);
}

function daysAgo(n) {
  return hoursAgo(n * 24);
}

// Newest first for readability here — createdAt below controls actual sort
// order in the app (query sorts by createdAt desc), not array position.
const NOTIFICATIONS = [
  {
    icon: '🔥',
    title: 'Attendance Streak',
    message: "You're on a 12-day attendance streak! Keep it up.",
    isRead: false,
    createdAt: hoursAgo(3),
  },
  {
    icon: '📄',
    title: 'Assignment Due Soon',
    message: 'Your Web Development assignment is due in 2 days.',
    isRead: false,
    createdAt: hoursAgo(6),
  },
  {
    icon: '📝',
    title: 'New Quiz Available',
    message: 'A new quiz is available in AI & Data Science.',
    isRead: false,
    createdAt: hoursAgo(20),
  },
  {
    icon: '💰',
    title: 'Payment Confirmed',
    message: 'Your Jun 2026 fee payment was confirmed.',
    isRead: true,
    createdAt: daysAgo(3),
  },
  {
    icon: '👋',
    title: 'Welcome to TITAN',
    message: 'Welcome to the TITAN Student Portal! Explore your courses to get started.',
    isRead: true,
    createdAt: daysAgo(30),
  },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);

  const student = await Student.findOne({ cnic: STUDENT_CNIC });
  if (!student) {
    console.error(`No student found with CNIC ${STUDENT_CNIC}. Run "npm run seed" first.`);
    process.exit(1);
  }

  const existingCount = await Notification.countDocuments({ student: student._id });
  if (existingCount > 0) {
    console.log(`${existingCount} notifications already exist for ${student.name}. Skipping.`);
    await mongoose.disconnect();
    return;
  }

  for (const item of NOTIFICATIONS) {
    await Notification.create({ student: student._id, ...item });
  }

  const unread = NOTIFICATIONS.filter((n) => !n.isRead).length;
  console.log(`Seeded ${NOTIFICATIONS.length} notifications for ${student.name} (${unread} unread).`);

  await mongoose.disconnect();
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err.message);
    process.exit(1);
  });
