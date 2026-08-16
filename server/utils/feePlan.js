// Fee amounts have no home of their own anywhere in the data model — no
// field on Student, Slot, or Course carries a monthly fee. The only place a
// number was ever decided is student-portal/server/utils/seedFeeVouchers.js,
// which hardcodes this exact per-course map to seed historical vouchers.
// Mirrored here (not imported — server/ and student-portal/server/ are
// separate apps that only share the Mongo collection, see FeeVoucher.js)
// so admin-triggered voucher generation defaults to the same amounts the
// seed already used, instead of inventing a second, divergent number.
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

function monthlyFeeForCourse(course) {
  return COURSE_MONTHLY_FEE[course] || DEFAULT_MONTHLY_FEE;
}

// Same "Jun 2026" shape as FeeVoucher.month everywhere else (see
// seedFeeVouchers.js) so a generated voucher's month string matches what's
// already stored and can be found by a plain equality query.
function currentMonthLabel(date = new Date()) {
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

// Matches seedFeeVouchers.js's convention of due-on-the-5th for the current
// month's voucher.
function currentMonthDueDate(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 5);
}

// rollNumber is unique per student, so year+month+rollNumber is
// collision-free across the whole collection (same reasoning as
// seedFeeVouchers.js's voucherId).
function buildVoucherId(date, rollNumber) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}${m}${rollNumber}`;
}

function isOverdue(voucher, now = new Date()) {
  return voucher.status === 'pending' && new Date(voucher.dueDate) < now;
}

// Fee vouchers only ever make sense for students who were actually admitted
// — pending/rejected are admissions-applicant states (see Student.js),
// never billed. Same roster definition used to exclude them from every
// other roster surface (StudentsPage's roster=true, dashboards, reports).
const BILLABLE_STATUSES = ['enrolled', 'completed', 'dropout'];

module.exports = {
  COURSE_MONTHLY_FEE,
  DEFAULT_MONTHLY_FEE,
  monthlyFeeForCourse,
  currentMonthLabel,
  currentMonthDueDate,
  buildVoucherId,
  isOverdue,
  BILLABLE_STATUSES,
};
