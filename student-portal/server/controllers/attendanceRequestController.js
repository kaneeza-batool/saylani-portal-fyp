const StudentAttendanceRequest = require('../models/StudentAttendanceRequest');
const StudentAttendance = require('../models/StudentAttendance');

function startOfToday() {
  return new Date(new Date().toDateString());
}

// The only way a student's attendance gets marked now is Super Admin/
// Sub-Admin scanning their ID card QR (see server/controllers/
// attendanceScanController.js in the main app) — this app no longer has a
// direct self-mark path. What's left here is purely the request/dispute
// flow: a student can ask for their attendance to be corrected or created,
// for whenever the scanner wasn't available or something went wrong; an
// admin still has to approve it.
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
