const AttendanceRequest = require('../models/AttendanceRequest');
const TrainerAttendance = require('../models/TrainerAttendance');

exports.getRequests = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const { status } = req.query;

    const filter = {};
    if (status && status !== 'all') filter.status = status;

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

    const request = await AttendanceRequest.create({
      trainerAttendance: attendance._id,
      trainerName: attendance.trainerName,
      campus: attendance.campus,
      schedule: attendance.schedule,
      requestedCheckIn: requestedCheckIn || null,
      requestedCheckOut: requestedCheckOut || null,
      reason,
    });

    return res.status(201).json({ item: request });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to create request', error: err.message });
  }
};

exports.resolveRequest = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'status must be "approved" or "rejected"' });
    }

    const request = await AttendanceRequest.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!request) return res.status(404).json({ message: 'Request not found' });

    if (status === 'approved') {
      const update = {};
      if (request.requestedCheckIn) update.checkIn = request.requestedCheckIn;
      if (request.requestedCheckOut) update.checkOut = request.requestedCheckOut;
      if (Object.keys(update).length) {
        await TrainerAttendance.findByIdAndUpdate(request.trainerAttendance, update);
      }
    }

    return res.status(200).json({ item: request });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to resolve request', error: err.message });
  }
};
