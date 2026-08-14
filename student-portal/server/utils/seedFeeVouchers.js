require('dotenv').config();

const mongoose = require('mongoose');
const Student = require('../models/Student');
const Course = require('../models/Course');
const FeeVoucher = require('../models/FeeVoucher');

const STUDENT_CNIC = '4550476281307';

function monthDate(offset) {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - offset);
  return d;
}

function voucherId(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const random = String(Math.floor(100000 + Math.random() * 900000));
  return `${y}${m}${random}`;
}

async function seedCourseVouchers(student, course, opts) {
  const existingCount = await FeeVoucher.countDocuments({ student: student._id, courseId: course._id });
  if (existingCount > 0) {
    console.log(`  ${course.name}: already has ${existingCount} fee vouchers. Skipping.`);
    return;
  }

  const vouchers = [];
  for (let offset = 0; offset < opts.monthsBack; offset += 1) {
    const base = monthDate(offset);
    const dueDate = new Date(base.getFullYear(), base.getMonth(), 5);

    vouchers.push({
      student: student._id,
      courseId: course._id,
      month: base.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      amount: opts.monthlyAmount,
      type: 'Monthly',
      dueDate,
      voucherId: voucherId(base),
      status: opts.pendingOffsets.includes(offset) ? 'pending' : 'paid',
    });
  }

  await FeeVoucher.insertMany(vouchers);

  const paid = vouchers.filter((v) => v.status === 'paid').length;
  const pending = vouchers.filter((v) => v.status === 'pending').length;
  console.log(`  ${course.name}: seeded ${vouchers.length} vouchers (paid=${paid}, pending=${pending}, Rs. ${opts.monthlyAmount}/mo).`);
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

  console.log(`Seeding fee vouchers for ${student.fullName}...`);

  // Web Development — longer-running, 12 months of history.
  await seedCourseVouchers(student, webDev, {
    monthsBack: 12,
    monthlyAmount: 4500,
    pendingOffsets: [0, 5], // current month + one scattered past month
  });

  // AI & Data Science — pricier bootcamp, shorter history, more pending.
  await seedCourseVouchers(student, aiDs, {
    monthsBack: 4,
    monthlyAmount: 6000,
    pendingOffsets: [0, 2],
  });

  await mongoose.disconnect();
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err.message);
    process.exit(1);
  });
