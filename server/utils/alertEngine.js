const Student = require('../models/Student');
const StudentAttendance = require('../models/StudentAttendance');
const Alert = require('../models/Alert');
const User = require('../models/User');
const { getIO } = require('./socket');
const { sendMail } = require('./mailer');

function emitAlert(alert) {
  const io = getIO();
  if (io) io.emit('alert:new', alert);
}

async function notifyAdmin(alert) {
  try {
    const admin = process.env.ADMIN_NOTIFY_EMAIL || (await User.findOne({ role: 'super_admin' }).select('email'))?.email;
    if (!admin) return;
    const tone = alert.severity === 'critical' ? '#C0392B' : '#B7791F';
    await sendMail({
      to: admin,
      subject: `TITAN Alert — ${alert.type === 'attendance' ? 'Attendance' : 'Payment'} (${alert.severity})`,
      html: `<div style="font-family:sans-serif;padding:16px">
        <h2 style="color:#12234A;margin:0 0 8px">TITAN Portal Alert</h2>
        <p style="color:${tone};font-weight:600;text-transform:uppercase;font-size:12px;margin:0 0 6px">${alert.severity}</p>
        <p style="color:#333;margin:0">${alert.message}</p>
      </div>`,
    });
  } catch (err) {
    console.error('[alertEngine] notifyAdmin failed:', err.message);
  }
}

async function checkAttendanceAlerts() {
  const students = await Student.find({ status: { $in: ['enrolled', 'pending'] } });

  for (const student of students) {
    const recent = await StudentAttendance.find({ student: student._id }).sort({ date: -1 }).limit(3);
    const hasThreeConsecutiveAbsences = recent.length === 3 && recent.every((r) => r.status === 'absent');
    const existing = await Alert.findOne({ student: student._id, type: 'attendance', status: 'active' });

    if (hasThreeConsecutiveAbsences && !existing) {
      const alert = await Alert.create({
        type: 'attendance',
        severity: 'critical',
        student: student._id,
        studentName: student.name,
        message: `${student.name} has been absent for 3 consecutive sessions.`,
      });
      emitAlert(alert);
      notifyAdmin(alert);
    } else if (!hasThreeConsecutiveAbsences && existing) {
      // condition cleared (e.g. they showed up) — auto-resolve rather than
      // leave a stale alert sitting active.
      existing.status = 'resolved';
      await existing.save();
    }
  }
}

async function checkPaymentAlerts() {
  const overdueStudents = await Student.find({ status: { $in: ['enrolled', 'pending'] }, payment: 'overdue' });
  const overdueIds = new Set(overdueStudents.map((s) => String(s._id)));

  for (const student of overdueStudents) {
    const existing = await Alert.findOne({ student: student._id, type: 'payment', status: 'active' });
    if (!existing) {
      const alert = await Alert.create({
        type: 'payment',
        severity: 'warning',
        student: student._id,
        studentName: student.name,
        message: `${student.name}'s payment is overdue.`,
      });
      emitAlert(alert);
      notifyAdmin(alert);
    }
  }

  const activePaymentAlerts = await Alert.find({ type: 'payment', status: 'active' });
  for (const alert of activePaymentAlerts) {
    if (!overdueIds.has(String(alert.student))) {
      alert.status = 'resolved';
      await alert.save();
    }
  }
}

async function runAlertChecks() {
  try {
    await checkAttendanceAlerts();
    await checkPaymentAlerts();
  } catch (err) {
    console.error('Alert engine run failed:', err.message);
  }
}

function startAlertEngine() {
  const cron = require('node-cron');
  // Every 2 minutes — frequent enough to feel "live" in a demo, cheap
  // enough at this data scale to not matter.
  cron.schedule('*/2 * * * *', runAlertChecks);
  runAlertChecks(); // also run once on boot so a fresh demo has data immediately
}

module.exports = { runAlertChecks, startAlertEngine };
