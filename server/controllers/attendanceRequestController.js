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

exports.createRequest = async (req, res) => {
  try {
    const { trainerAttendanceId, requestedCheckIn, requestedCheckOut, reason } = req.body;
    if (!trainerAttendanceId || !reason) {
      return res.status(400).json({ message: 'trainerAttendanceId and reason are required' });
    }

    const attendance = await TrainerAttendance.findById(trainerAttendanceId);
    if (!attendance) return res.status(404).json({ message: 'Attendance record not found' });

    // Two ways in: a trainer raising a correction on their own record
    // (self-service), or Super Admin raising one on a trainer's behalf from
    // the View Attendance page — same as before this feature existed.
    // Sub-admins don't get a create path here; they only resolve.
    if (req.user.role === 'trainer') {
      const trainerProfile = await Trainer.findOne({ email: req.user.email }).select('_id');
      if (!trainerProfile || String(attendance.trainer) !== String(trainerProfile._id)) {
        return res.status(403).json({ message: 'You can only request a correction on your own attendance record.' });
      }
    } else if (req.user.role !== 'super_admin') {
      return res.status(403).json({ message: 'You do not have permission to raise this request.' });
    }

    const existing = await AttendanceRequest.findOne({ trainerAttendance: attendance._id, status: 'pending' });
    if (existing) return res.status(409).json({ message: 'A correction request for this record is already pending.' });

    const request = await AttendanceRequest.create({
      trainerAttendance: attendance._id,
      trainer: attendance.trainer,
      trainerName: attendance.trainerName,
      campus: attendance.campus,
      schedule: attendance.schedule,
      requestedCheckIn: requestedCheckIn || null,
      requestedCheckOut: requestedCheckOut || null,
      reason,
    });

    logAudit({
      actor: req.user,
      action: 'create',
      resourceType: 'AttendanceRequest',
      resourceId: request._id,
      summary: `Requested attendance correction for "${request.trainerName}"`,
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
      if (Object.keys(update).length) {
        await TrainerAttendance.findByIdAndUpdate(request.trainerAttendance, update);
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
    const attendance = await TrainerAttendance.findById(request.trainerAttendance).populate('trainer', 'email');
    const to = attendance?.trainer?.email;
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
