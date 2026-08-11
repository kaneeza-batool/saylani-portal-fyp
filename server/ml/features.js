// Feature engineering shared between synthetic-data training
// (trainDropoutModel.js) and live scoring (mlController.js) — the two
// MUST compute features the same way or the model's learned weights
// stop meaning anything.
//
// Feature vector (all normalized to roughly [0, 1]):
//   [0] attendanceRate     — present / total attendance records (0.5 if no records: unknown, stays neutral)
//   [1] paymentOverdue     — 1 if payment status is 'overdue', else 0
//   [2] paymentPending     — 1 if payment status is 'pending', else 0
//   [3] tenureMonths       — months since enrollment, capped at 12 and scaled to [0,1]
//   [4] statusPending      — 1 if student status is 'pending' (never fully enrolled), else 0

const FEATURE_NAMES = ['attendanceRate', 'paymentOverdue', 'paymentPending', 'tenureMonths', 'statusPending'];

function computeFeatures({ student, attendanceRecords }) {
  const total = attendanceRecords.length;
  const present = attendanceRecords.filter((r) => r.status === 'present').length;
  const attendanceRate = total > 0 ? present / total : 0.5;

  const paymentOverdue = student.payment === 'overdue' ? 1 : 0;
  const paymentPending = student.payment === 'pending' ? 1 : 0;

  const createdAt = student.createdAt ? new Date(student.createdAt) : new Date();
  const monthsSince = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30);
  const tenureMonths = Math.min(monthsSince, 12) / 12;

  const statusPending = student.status === 'pending' ? 1 : 0;

  return [attendanceRate, paymentOverdue, paymentPending, tenureMonths, statusPending];
}

module.exports = { computeFeatures, FEATURE_NAMES };
