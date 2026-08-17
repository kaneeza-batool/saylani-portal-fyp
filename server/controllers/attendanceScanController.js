const Student = require('../models/Student');
const StudentAttendance = require('../models/StudentAttendance');
const Trainer = require('../models/Trainer');
const TrainerAttendance = require('../models/TrainerAttendance');
const { logAudit, resolveCampusIdByName } = require('../utils/auditLogger');

// Single entry point for Super Admin/Sub-Admin's "scan an ID card" attendance
// flow (see client/src/components/QrAttendanceScanner.jsx) — this is now the
// ONLY place either Student or Trainer attendance gets marked day-to-day.
// Trainer Portal and Student Portal no longer mark attendance directly at
// all (both were removed in favor of this); they're left with only their
// existing "request attendance" flows (attendanceRequestController.js /
// studentAttendanceRequestController.js), untouched by this change and
// still the fallback when this scanner isn't available.
//
// One scan, either card type, auto-detected from the decoded QR payload's
// `type` field (the exact {org,type,id,name} shape already encoded by
// IDCardModal.jsx/StudentIdCardModal.jsx) — the caller doesn't pick a mode.
// Idempotent by design: scanning the same person twice in a day never
// errors, it just reports what's already on record, since a rapid-fire
// scanning workflow at an entrance will always get accidental repeat scans.

function startOfToday() {
  return new Date(new Date().toDateString());
}

// Permission is checked here, not via router-level checkPermission
// middleware, since a single route dynamically serves two different
// permission modules depending on the scanned card's type.
function hasPermission(user, moduleName) {
  return user.role === 'super_admin' || user.permissions?.[moduleName]?.write === true;
}

async function scanStudent(req, res, payload) {
  if (!hasPermission(req.user, 'ATTENDANCE_MARK')) {
    return res.status(403).json({ message: 'You do not have permission to mark student attendance' });
  }

  const student = await Student.findOne({ rollNumber: payload.id, ...req.campusFilter }).populate('campus', 'name');
  if (!student) return res.status(404).json({ message: `No student found with roll number ${payload.id}` });
  if (student.status === 'dropout') {
    return res.status(409).json({ message: `${student.name}'s status is invalid: '${student.status}'` });
  }

  const existing = await StudentAttendance.findOne({ student: student._id, date: startOfToday() });
  if (existing) {
    return res.status(200).json({ type: 'Student', action: 'already_marked', name: student.name, record: existing });
  }

  const record = await StudentAttendance.create({
    student: student._id,
    studentName: student.name,
    rollNumber: student.rollNumber,
    course: student.course,
    campus: student.campus?.name || '',
    date: startOfToday(),
    status: 'present',
  });

  logAudit({
    actor: req.user,
    action: 'create',
    resourceType: 'StudentAttendance',
    resourceId: record._id,
    summary: `Marked "${record.studentName}" present (QR scan)`,
    resourceCampus: await resolveCampusIdByName(record.campus),
  });

  return res.status(201).json({ type: 'Student', action: 'marked_present', name: student.name, record });
}

async function scanTrainer(req, res, payload) {
  if (!hasPermission(req.user, 'TRAINER_ATTENDANCE_MARK')) {
    return res.status(403).json({ message: 'You do not have permission to mark trainer attendance' });
  }

  const trainer = await Trainer.findOne({ employeeId: payload.id, ...req.campusFilter });
  if (!trainer) return res.status(404).json({ message: `No trainer found with employee ID ${payload.id}` });

  const existing = await TrainerAttendance.findOne({ trainer: trainer._id, date: startOfToday() });

  if (existing?.checkIn && existing?.checkOut) {
    return res.status(200).json({ type: 'Trainer', action: 'already_marked', name: trainer.name, record: existing });
  }

  let record;
  let action;
  if (existing?.checkIn) {
    record = await TrainerAttendance.findByIdAndUpdate(existing._id, { checkOut: new Date() }, { new: true });
    action = 'checked_out';
  } else {
    record = await TrainerAttendance.create({
      trainer: trainer._id,
      trainerName: trainer.name,
      employeeId: trainer.employeeId,
      campus: trainer.city,
      date: startOfToday(),
      checkIn: new Date(),
    });
    action = 'checked_in';
  }

  logAudit({
    actor: req.user,
    action: existing ? 'update' : 'create',
    resourceType: 'TrainerAttendance',
    resourceId: record._id,
    summary: `${action === 'checked_out' ? 'Checked out' : 'Checked in'} "${record.trainerName}" (QR scan)`,
    resourceCampus: await resolveCampusIdByName(record.campus),
  });

  return res.status(action === 'checked_out' ? 200 : 201).json({ type: 'Trainer', action, name: trainer.name, record });
}

exports.scanAttendance = async (req, res) => {
  try {
    const { payload } = req.body;
    if (!payload || payload.org !== 'TITAN' || !payload.id || !['Student', 'Trainer'].includes(payload.type)) {
      return res.status(400).json({ message: 'Not a recognized TITAN ID card.' });
    }

    if (payload.type === 'Student') return await scanStudent(req, res, payload);
    return await scanTrainer(req, res, payload);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to mark attendance', error: err.message });
  }
};
