require('dotenv').config();

const mongoose = require('mongoose');
const Student = require('../models/Student');
const FeeVoucher = require('../models/FeeVoucher');

// One course per student now (see Student.js) — no Course model to look up
// against, no per-course loop. Only enrolled/completed students get billed;
// pending/rejected/dropout applicants were never actually charged.
const MONTHS_BACK = 6;

const COURSE_MONTHLY_FEE = {
  'Web Development': 4500,
  'AI & Data Science': 6000,
  'Graphic Designing': 4000,
  'Mobile App Development (Flutter)': 5000,
  'Digital Marketing': 3500,
  'UI/UX Design': 4500,
  'Cybersecurity Fundamentals': 5500,
};
const DEFAULT_MONTHLY_FEE = 4500;

function monthStart(offsetFromNow) {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  d.setMonth(d.getMonth() - offsetFromNow);
  return d;
}

// rollNumber is already unique per student (unique index on Student), so
// year+month+rollNumber is guaranteed collision-free across the whole
// collection without needing a random suffix.
function voucherId(date, rollNumber) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}${m}${rollNumber}`;
}

// The model only has paid/pending — no distinct "overdue" enum value, and
// adding one wasn't in scope. Overdue is represented the same way most fee
// systems actually do it: a pending voucher whose due date has already
// passed, distinguishable purely by date. That keeps the current month's
// voucher aligned with Student.payment without a schema change:
//   - paid    -> voucher paid, due date already passed (unremarkable)
//   - pending -> voucher pending, due date a few days in the FUTURE (not yet due)
//   - overdue -> voucher pending, due date on the 5th of THIS month (already past)
// Every trailing month before the current one is left 'paid' regardless —
// a student who's overdue today was presumably fine last month; only the
// current month should ever contradict-or-confirm the live admin status.
function buildVouchers(student) {
  const monthlyFee = COURSE_MONTHLY_FEE[student.course] || DEFAULT_MONTHLY_FEE;
  const vouchers = [];

  for (let offset = MONTHS_BACK - 1; offset >= 1; offset -= 1) {
    const base = monthStart(offset);
    vouchers.push({
      student: student._id,
      month: base.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      amount: monthlyFee,
      type: 'Monthly',
      dueDate: new Date(base.getFullYear(), base.getMonth(), 5),
      voucherId: voucherId(base, student.rollNumber),
      status: 'paid',
    });
  }

  const current = monthStart(0);
  const now = new Date();
  let status = 'paid';
  let dueDate = new Date(current.getFullYear(), current.getMonth(), 5);

  if (student.payment === 'overdue') {
    status = 'pending';
    // dueDate stays on the 5th of this month — already passed.
  } else if (student.payment === 'pending') {
    status = 'pending';
    dueDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 5);
  }

  vouchers.push({
    student: student._id,
    month: current.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    amount: monthlyFee,
    type: 'Monthly',
    dueDate,
    voucherId: voucherId(current, student.rollNumber),
    status,
  });

  return vouchers;
}

async function seedStudentVouchers(student) {
  const existingCount = await FeeVoucher.countDocuments({ student: student._id });
  if (existingCount > 0) return { seeded: 0 };

  const vouchers = buildVouchers(student);
  await FeeVoucher.insertMany(vouchers);
  return { seeded: vouchers.length };
}

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);

  const students = await Student.find({ status: { $in: ['enrolled', 'completed'] } });
  console.log(`Seeding fee vouchers for ${students.length} enrolled/completed students...`);

  let totalSeeded = 0;
  let studentsSeeded = 0;
  let studentsSkipped = 0;

  for (const student of students) {
    const { seeded } = await seedStudentVouchers(student);
    if (seeded > 0) {
      totalSeeded += seeded;
      studentsSeeded += 1;
    } else {
      studentsSkipped += 1;
    }
  }

  console.log(
    `Done. ${studentsSeeded} students seeded (${totalSeeded} vouchers total), ${studentsSkipped} already had vouchers and were skipped.`
  );

  await mongoose.disconnect();
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err.message);
    process.exit(1);
  });
