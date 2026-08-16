const StudentAttendanceRequest = require('../models/StudentAttendanceRequest');
const StudentAttendance = require('../models/StudentAttendance');

function startOfToday() {
  return new Date(new Date().toDateString());
}

// Direct self-service: a student marks themselves present for today,
// no admin involved — the "scan your own QR/ID" flow's happy path. Only
// works for today, and only once: if a record already exists (trainer
// already marked the class, or the student already self-marked), this
// deliberately refuses rather than silently overwriting it — a wrong or
// disputed record goes through createRequest instead, same as any other
// correction.
exports.selfMarkPresent = async (req, res) => {
  try {
    const today = startOfToday();
    const existing = await StudentAttendance.findOne({ student: req.student._id, date: today });
    if (existing) {
      return res.status(409).json({
        message: 'Today\'s attendance is already marked. Use Request Attendance if it needs to be corrected.',
        record: existing,
      });
    }

    const record = await StudentAttendance.create({
      student: req.student._id,
      studentName: req.student.name,
      rollNumber: req.student.rollNumber,
      course: req.student.course,
      campus: req.student.campus?.name || '',
      date: today,
      status: 'present',
    });

    return res.status(201).json({ record });
  } catch (err) {
    // Unique index race (student+date) — someone/something else marked it
    // in the moment between the findOne check and this create.
    if (err.code === 11000) {
      return res.status(409).json({ message: "Today's attendance is already marked." });
    }
    return res.status(500).json({ message: 'Failed to mark attendance', error: err.message });
  }
};

// Self-service fallback for when direct marking isn't available (QR/ID
// didn't scan, or the student didn't have it on them at the time) —
// same request-and-wait-for-approval flow as disputing an existing record,
// just without one to point at yet. Writes straight into the shared
// collection Super Admin/Sub-Admin read from.
exports.createRequest = async (req, res) => {
  try {
    const { attendanceRecordId, date, requestedStatus, reason } = req.body;
    if (!requestedStatus || !reason) {
      return res.status(400).json({ message: 'requestedStatus and reason are required' });
    }
    if (!['present', 'absent', 'leave'].includes(requestedStatus)) {
      return res.status(400).json({ message: 'requestedStatus must be present, absent, or leave' });
    }

    if (attendanceRecordId) {
      // Disputing an existing record — ownership check: only the record's
      // own student can dispute it.
      const record = await StudentAttendance.findOne({ _id: attendanceRecordId, student: req.student._id });
      if (!record) return res.status(404).json({ message: 'Attendance record not found' });

      const existingRequest = await StudentAttendanceRequest.findOne({ attendanceRecord: record._id, status: 'pending' });
      if (existingRequest) return res.status(409).json({ message: 'A correction request for this day is already pending.' });

      const request = await StudentAttendanceRequest.create({
        attendanceRecord: record._id,
        student: req.student._id,
        studentName: req.student.name,
        rollNumber: req.student.rollNumber,
        course: record.course,
        campus: req.student.campus?.name || '',
        date: record.date,
        currentStatus: record.status,
        requestedStatus,
        reason,
      });
      return res.status(201).json({ item: request });
    }

    // No existing record — requesting one be created (self-marking wasn't
    // available). Only for today or earlier, never a future date.
    if (!date) return res.status(400).json({ message: 'date is required when there is no existing attendance record' });
    const requestedDate = new Date(new Date(date).toDateString());
    if (requestedDate > startOfToday()) {
      return res.status(400).json({ message: 'You can only request attendance for today or an earlier date.' });
    }

    const already = await StudentAttendance.findOne({ student: req.student._id, date: requestedDate });
    if (already) return res.status(409).json({ message: 'Attendance for this day is already marked — use a correction request instead.' });

    const existingRequest = await StudentAttendanceRequest.findOne({
      student: req.student._id,
      date: requestedDate,
      attendanceRecord: null,
      status: 'pending',
    });
    if (existingRequest) return res.status(409).json({ message: 'A request for this day is already pending.' });

    const request = await StudentAttendanceRequest.create({
      attendanceRecord: null,
      student: req.student._id,
      studentName: req.student.name,
      rollNumber: req.student.rollNumber,
      course: req.student.course,
      campus: req.student.campus?.name || '',
      date: requestedDate,
      currentStatus: 'not_marked',
      requestedStatus,
      reason,
    });
    return res.status(201).json({ item: request });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to submit request', error: err.message });
  }
};

exports.getMyRequests = async (req, res) => {
  try {
    const items = await StudentAttendanceRequest.find({ student: req.student._id }).sort({ createdAt: -1 });
    return res.status(200).json({ items });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load requests', error: err.message });
  }
};
