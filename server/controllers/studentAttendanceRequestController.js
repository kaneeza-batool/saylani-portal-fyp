const StudentAttendanceRequest = require('../models/StudentAttendanceRequest');
const StudentAttendance = require('../models/StudentAttendance');
const Campus = require('../models/Campus');
const { logAudit, resolveCampusIdByName } = require('../utils/auditLogger');

// These requests are only ever CREATED from the Student Portal (a student
// disputing their own attendance) — see the mirror controller under
// student-portal/server/controllers. This controller only lists and
// resolves them, same division of responsibility as attendanceRequestController.

async function resolveSubAdminCampusName(req) {
  const campus = await Campus.findById(req.user.campus_id).select('name');
  return campus?.name || '__no_campus__';
}

exports.getRequests = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const { status } = req.query;

    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (req.user.role === 'sub_admin') filter.campus = await resolveSubAdminCampusName(req);

    const [items, total] = await Promise.all([
      StudentAttendanceRequest.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      StudentAttendanceRequest.countDocuments(filter),
    ]);

    return res.status(200).json({ items, total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load requests', error: err.message });
  }
};

exports.resolveRequest = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'status must be "approved" or "rejected"' });
    }

    // Atomic on status: 'pending', same race-safe pattern as
    // attendanceRequestController.resolveRequest — whichever admin's write
    // lands first wins; the other gets null back instead of double-acting.
    const filter = { _id: req.params.id, status: 'pending' };
    if (req.user.role === 'sub_admin') filter.campus = await resolveSubAdminCampusName(req);

    const request = await StudentAttendanceRequest.findOneAndUpdate(
      filter,
      { status, resolvedByName: req.user.name, resolvedByRole: req.user.role },
      { new: true }
    );
    if (!request) {
      return res.status(409).json({ message: 'This request was already resolved, or is not in your campus.' });
    }

    if (status === 'approved') {
      if (request.attendanceRecord) {
        await StudentAttendance.findByIdAndUpdate(request.attendanceRecord, { status: request.requestedStatus });
      } else {
        // No existing record (self-marking wasn't available and nobody had
        // marked the class yet) — approving this creates one, same upsert
        // shape trainerStudentAttendanceController.markAttendance already
        // writes for admin/trainer-marked days.
        await StudentAttendance.findOneAndUpdate(
          { student: request.student, date: request.date },
          {
            student: request.student,
            studentName: request.studentName,
            rollNumber: request.rollNumber,
            course: request.course,
            campus: request.campus,
            date: request.date,
            status: request.requestedStatus,
          },
          { upsert: true, setDefaultsOnInsert: true }
        );
      }
    }

    logAudit({
      actor: req.user,
      action: 'update',
      resourceType: 'StudentAttendanceRequest',
      resourceId: request._id,
      summary: `${status === 'approved' ? 'Approved' : 'Rejected'} attendance correction for "${request.studentName}"`,
      resourceCampus: await resolveCampusIdByName(request.campus),
    });

    return res.status(200).json({ item: request });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to resolve request', error: err.message });
  }
};
