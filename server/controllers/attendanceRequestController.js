const AttendanceRequest = require('../models/AttendanceRequest');
const TrainerAttendance = require('../models/TrainerAttendance');
const Trainer = require('../models/Trainer');
const Campus = require('../models/Campus');
const { sendMail } = require('../utils/mailer');
const { logAudit, resolveCampusIdByName } = require('../utils/auditLogger');

// Sub-admins are scoped to their own campus. Unlike StudentAttendance
// (whose .campus is the full Campus.name), TrainerAttendance.campus is
// filled in from Trainer.city / trainer.city at check-in time (see
// trainerAttendanceController.checkIn and TrainersAttendanceMark.jsx) — a
// short city string, not the branded campus name — so this resolves the
// sub-admin's own campus to its city to match that same convention rather
// than reusing the name-based resolver studentAttendanceController uses.
async function resolveSubAdminCampusName(req) {
  const campus = await Campus.findById(req.user.campus_id).select('city');
  return campus?.city || '__no_campus__';
}

exports.getRequests = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const { status } = req.query;

    const filter = {};
    if (status && status !== 'all') filter.status = status;

    if (req.user.role === 'trainer') {
      // A trainer only ever sees their own requests, never anyone else's.
      const trainerProfile = await Trainer.findOne({ email: req.user.email }).select('_id');
      filter.trainer = trainerProfile?._id || null;
    } else if (req.user.role === 'sub_admin') {
      filter.campus = await resolveSubAdminCampusName(req);
    }
    // super_admin: no extra filter, sees every campus.

    const [items, total] = await Promise.all([
      AttendanceRequest.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      AttendanceRequest.countDocuments(filter),
    ]);

    return res.status(200).json({ items, total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load requests', error: err.message });
  }
};

// Self-service only, always the trainer raising a request on their own
// attendance — Super Admin/Sub-Admin never create one, they only resolve
// (they already have full authority; there's nothing to "request" from
// themselves). Two shapes, both ending up as one AttendanceRequest:
//  - trainerAttendanceId given: correcting an existing record.
//  - date given instead: requesting attendance for a day with no record at
//    all (e.g. a missed check-in) — resolveRequest creates one on approval,
//    same "attendanceRecord: null means create one" pattern
//    studentAttendanceRequestController already uses.
exports.createRequest = async (req, res) => {
  try {
    const { trainerAttendanceId, date, requestedCheckIn, requestedCheckOut, reason } = req.body;
    if (!reason) return res.status(400).json({ message: 'reason is required' });
    if (!trainerAttendanceId && !date) {
      return res.status(400).json({ message: 'Either trainerAttendanceId or date is required' });
    }
    if (req.user.role !== 'trainer') {
      return res.status(403).json({ message: 'Only a trainer can raise a correction request on their own attendance.' });
    }

    const trainerProfile = await Trainer.findOne({ email: req.user.email });
    if (!trainerProfile) return res.status(404).json({ message: 'Trainer profile not found' });

    let attendance = null;
    let requestDate;
    let campus = trainerProfile.city;
    let schedule = '';

    if (trainerAttendanceId) {
      attendance = await TrainerAttendance.findById(trainerAttendanceId);
      if (!attendance) return res.status(404).json({ message: 'Attendance record not found' });
      if (String(attendance.trainer) !== String(trainerProfile._id)) {
        return res.status(403).json({ message: 'You can only request a correction on your own attendance record.' });
      }
      requestDate = attendance.date;
      campus = attendance.campus;
      schedule = attendance.schedule;

      const existing = await AttendanceRequest.findOne({ trainerAttendance: attendance._id, status: 'pending' });
      if (existing) return res.status(409).json({ message: 'A correction request for this record is already pending.' });
    } else {
      requestDate = new Date(new Date(date).toDateString());
      const alreadyRecorded = await TrainerAttendance.findOne({ trainer: trainerProfile._id, date: requestDate });
      if (alreadyRecorded) {
        return res.status(409).json({ message: 'Attendance already exists for this date — request a correction on it directly instead.' });
      }
      const existing = await AttendanceRequest.findOne({ trainer: trainerProfile._id, date: requestDate, status: 'pending' });
      if (existing) return res.status(409).json({ message: 'A request for this date is already pending.' });
    }

    const request = await AttendanceRequest.create({
      trainerAttendance: attendance?._id || null,
      trainer: trainerProfile._id,
      trainerName: trainerProfile.name,
      employeeId: trainerProfile.employeeId,
      campus,
      schedule,
      date: requestDate,
      requestedCheckIn: requestedCheckIn || null,
      requestedCheckOut: requestedCheckOut || null,
      reason,
    });

    logAudit({
      actor: req.user,
      action: 'create',
      resourceType: 'AttendanceRequest',
      resourceId: request._id,
      summary: `Requested attendance ${attendance ? 'correction' : ''} for "${request.trainerName}"`,
      resourceCampus: await resolveCampusIdByName(request.campus),
    });

    return res.status(201).json({ item: request });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to create request', error: err.message });
  }
};

exports.resolveRequest = async (req, res) => {
  try {
    if (req.user.role === 'trainer') {
      return res.status(403).json({ message: 'Only Super Admin or Sub-Admin can resolve a correction request.' });
    }

    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'status must be "approved" or "rejected"' });
    }

    // Filtering on status: 'pending' as part of the update makes this
    // atomic — if Super Admin and a Sub-Admin both click Approve on the
    // same request, only the first write actually matches and returns a
    // document; the second gets null back instead of double-processing it.
    const filter = { _id: req.params.id, status: 'pending' };
    if (req.user.role === 'sub_admin') {
      filter.campus = await resolveSubAdminCampusName(req);
    }

    const request = await AttendanceRequest.findOneAndUpdate(
      filter,
      { status, resolvedByName: req.user.name, resolvedByRole: req.user.role },
      { new: true }
    );
    if (!request) {
      return res.status(409).json({ message: 'This request was already resolved, or is not in your campus.' });
    }

    if (status === 'approved') {
      const update = {};
      if (request.requestedCheckIn) update.checkIn = request.requestedCheckIn;
      if (request.requestedCheckOut) update.checkOut = request.requestedCheckOut;

      if (request.trainerAttendance) {
        if (Object.keys(update).length) {
          await TrainerAttendance.findByIdAndUpdate(request.trainerAttendance, update);
        }
      } else {
        // No existing record — approving this creates one, same upsert
        // shape studentAttendanceRequestController.resolveRequest already
        // uses for its own "no record yet" case.
        await TrainerAttendance.findOneAndUpdate(
          { trainer: request.trainer, date: request.date },
          {
            trainer: request.trainer,
            trainerName: request.trainerName,
            employeeId: request.employeeId,
            campus: request.campus,
            schedule: request.schedule,
            date: request.date,
            ...update,
          },
          { upsert: true, setDefaultsOnInsert: true }
        );
      }
    }

    notifyTrainer(request, status);

    logAudit({
      actor: req.user,
      action: 'update',
      resourceType: 'AttendanceRequest',
      resourceId: request._id,
      summary: `${status === 'approved' ? 'Approved' : 'Rejected'} attendance correction for "${request.trainerName}"`,
      resourceCampus: await resolveCampusIdByName(request.campus),
    });

    return res.status(200).json({ item: request });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to resolve request', error: err.message });
  }
};

async function notifyTrainer(request, status) {
  try {
    // Looked up via the Trainer ref directly rather than through
    // TrainerAttendance — request.trainerAttendance is null for a
    // "no record yet" request, so that path can't be relied on here.
    const trainer = await Trainer.findById(request.trainer).select('email');
    const to = trainer?.email;
    if (!to) return;

    const approved = status === 'approved';
    await sendMail({
      to,
      subject: `TITAN — Attendance correction ${approved ? 'approved' : 'rejected'}`,
      html: `<div style="font-family:sans-serif;padding:16px">
        <h2 style="color:#12234A;margin:0 0 8px">Attendance Correction Request</h2>
        <p style="color:#333;margin:0 0 6px">Hi ${request.trainerName},</p>
        <p style="color:#333;margin:0 0 6px">Your attendance correction request for <strong>${request.schedule || 'your session'}</strong> at <strong>${request.campus || 'your campus'}</strong> has been
        <strong style="color:${approved ? '#1B6B45' : '#C0392B'}">${approved ? 'approved' : 'rejected'}</strong>.</p>
        <p style="color:#666;font-size:13px;margin:0">Reason given: ${request.reason}</p>
      </div>`,
    });
  } catch (err) {
    console.error('[attendanceRequestController] notifyTrainer failed:', err.message);
  }
}
