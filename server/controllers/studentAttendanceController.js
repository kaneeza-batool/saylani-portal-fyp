const Student = require('../models/Student');
const StudentAttendance = require('../models/StudentAttendance');
const Campus = require('../models/Campus');
const { logAudit, resolveCampusIdByName } = require('../utils/auditLogger');
const { escapeRegex } = require('../utils/regex');

function startOfToday() {
  return new Date(new Date().toDateString());
}

exports.lookupStudent = async (req, res) => {
  try {
    // req.campusFilter is {} for super_admin, {campus: ObjectId} for
    // sub_admin (campusScope) — Student.campus is a real ref, so this is
    // safe the same way studentController.getStudents already relies on it.
    // A sub_admin looking up another campus's roll number gets the same 404
    // as a nonexistent one, not a 403 — no need to leak that the roll
    // number exists elsewhere.
    const student = await Student.findOne({ rollNumber: req.params.rollNumber, ...req.campusFilter }).populate('campus', 'name city');
    if (!student) return res.status(404).json({ message: 'No student found with that roll number' });

    if (student.status === 'dropout') {
      return res.status(409).json({ message: `The student exists, but their status is invalid: '${student.status}'` });
    }

    const today = await StudentAttendance.findOne({ student: student._id, date: startOfToday() });
    const history = await StudentAttendance.find({ student: student._id }).sort({ date: -1 }).limit(5);

    return res.status(200).json({ student, today, history });
  } catch (err) {
    return res.status(500).json({ message: 'Lookup failed', error: err.message });
  }
};

exports.markAttendance = async (req, res) => {
  try {
    const { rollNumber, status } = req.body;
    // Same campus scoping as lookupStudent — a sub_admin can only mark
    // attendance for a student req.campusFilter actually resolves to.
    const student = await Student.findOne({ rollNumber, ...req.campusFilter }).populate('campus', 'name');
    if (!student) return res.status(404).json({ message: 'No student found with that roll number' });
    if (student.status === 'dropout') {
      return res.status(409).json({ message: `The student exists, but their status is invalid: '${student.status}'` });
    }

    const existing = await StudentAttendance.findOne({ student: student._id, date: startOfToday() });
    if (existing) return res.status(409).json({ message: 'Attendance already marked for today' });

    const record = await StudentAttendance.create({
      student: student._id,
      studentName: student.name,
      rollNumber: student.rollNumber,
      course: student.course,
      campus: student.campus?.name || '',
      date: startOfToday(),
      status: status || 'present',
    });

    logAudit({
      actor: req.user,
      action: 'create',
      resourceType: 'StudentAttendance',
      resourceId: record._id,
      summary: `Marked "${record.studentName}" ${record.status}`,
      resourceCampus: await resolveCampusIdByName(record.campus),
    });

    return res.status(201).json({ record });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to mark attendance', error: err.message });
  }
};

exports.markMultiple = async (req, res) => {
  try {
    const { rollNumbers, status } = req.body;
    if (!Array.isArray(rollNumbers) || rollNumbers.length === 0) {
      return res.status(400).json({ message: 'rollNumbers must be a non-empty array' });
    }

    // Out-of-campus roll numbers simply don't resolve here for a sub_admin
    // (req.campusFilter), so they fall into the existing `notFound` count
    // below rather than a separate error path — same "not reachable in this
    // scope reads as not found" convention as the roster elsewhere.
    const students = await Student.find({ rollNumber: { $in: rollNumbers }, ...req.campusFilter }).populate('campus', 'name');
    const today = startOfToday();
    const existing = await StudentAttendance.find({ student: { $in: students.map((s) => s._id) }, date: today });
    const alreadyMarked = new Set(existing.map((e) => String(e.student)));

    const toCreate = students
      .filter((s) => !alreadyMarked.has(String(s._id)))
      .map((s) => ({
        student: s._id,
        studentName: s.name,
        rollNumber: s.rollNumber,
        course: s.course,
        campus: s.campus?.name || '',
        date: today,
        status: status || 'present',
      }));

    const created = toCreate.length ? await StudentAttendance.insertMany(toCreate) : [];

    // One audit entry for the whole batch, not one per student — this is a
    // single click marking up to a class-sized roster, and 40 near-identical
    // "marked present" rows would drown out everything else in the log
    // without adding information a human would act on differently than the
    // rollup does. resourceId is null (no single resource represents the
    // batch); resourceCampus is only set when every created record shares
    // one campus — a genuinely mixed-campus batch has no single campus to
    // attribute it to, so it stays visible to super_admin only (the sole
    // role allowed to call this route) rather than showing under a campus
    // it wasn't fully about.
    if (created.length > 0) {
      const campusNames = new Set(created.map((r) => r.campus).filter(Boolean));
      const resourceCampus = campusNames.size === 1 ? await resolveCampusIdByName([...campusNames][0]) : null;
      logAudit({
        actor: req.user,
        action: 'create',
        resourceType: 'StudentAttendance',
        resourceId: null,
        summary: `Marked ${created.length} student${created.length === 1 ? '' : 's'} ${status || 'present'} (batch)`,
        resourceCampus,
      });
    }

    return res.status(201).json({
      marked: created.length,
      skipped: students.length - created.length,
      notFound: rollNumbers.length - students.length,
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to mark attendance', error: err.message });
  }
};

// StudentAttendance.campus is a cached display-name String, not an ObjectId
// ref (see model) — req.campusFilter from campusScope is shaped for real
// refs and would silently match zero records here, not error. Same fix as
// getAttendanceSummary/getAttendanceReports: resolve the requester's own
// campus name and match the cached string directly instead.
exports.getAttendance = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const { search, status } = req.query;

    const filter = {};
    if (req.user.role !== 'super_admin') {
      const campus = await Campus.findById(req.user.campus_id).select('name');
      filter.campus = campus?.name || '__no_campus__';
    }
    if (status && status !== 'all') filter.status = status;
    if (search && search.trim()) {
      // campus here is StudentAttendance's own cached-name String (snapshotted
      // at mark time above), not a ref — safe to regex-match directly.
      const re = new RegExp(escapeRegex(search.trim()), 'i');
      filter.$or = [{ studentName: re }, { campus: re }, { course: re }];
    }

    const [items, total] = await Promise.all([
      StudentAttendance.find(filter)
        .sort({ date: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      StudentAttendance.countDocuments(filter),
    ]);

    return res.status(200).json({ items, total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load attendance', error: err.message });
  }
};

// 30-day present/absent percentage. StudentAttendance.campus is a cached
// display-name String (see model), not an ObjectId ref like Student/Trainer/
// Slot — req.campusFilter from campusScope is shaped for those ({campus:
// ObjectId}) and would silently match zero records here, not error. So this
// deliberately does NOT use req.campusFilter: for a non-super_admin, it
// resolves req.user.campus_id to that Campus's name and matches the cached
// string directly instead. campusScope still runs in the route chain for
// consistency with every other campus-scoped route, its output is just
// unused by this one query.
exports.getAttendanceSummary = async (req, res) => {
  try {
    const since = new Date();
    since.setDate(since.getDate() - 30);
    since.setHours(0, 0, 0, 0);

    const filter = { date: { $gte: since } };

    if (req.user.role !== 'super_admin') {
      const campus = await Campus.findById(req.user.campus_id).select('name');
      // Fall back to a sentinel that matches nothing rather than leaving
      // filter.campus unset — an unset key would be dropped by the Mongo
      // driver and silently return every campus's data instead of none.
      filter.campus = campus?.name || '__no_campus__';
    }

    const rows = await StudentAttendance.aggregate([{ $match: filter }, { $group: { _id: '$status', count: { $sum: 1 } } }]);

    const counts = { present: 0, absent: 0, leave: 0 };
    for (const row of rows) {
      if (row._id in counts) counts[row._id] = row.count;
    }

    const denominator = counts.present + counts.absent;
    const percentage = denominator > 0 ? Math.round((counts.present / denominator) * 1000) / 10 : null;

    return res.status(200).json({
      percentage,
      present: counts.present,
      absent: counts.absent,
      leave: counts.leave,
      windowDays: 30,
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load attendance summary', error: err.message });
  }
};

// Per-student attendance rows for the campus (Attendance Reports page).
// Roster + batch come from Student, whose `campus` is a real ObjectId ref —
// req.campusFilter is safe there, same as studentController.getStudents.
// StudentAttendance.campus is not (see model comment above), so counts are
// additionally scoped by resolved campus name, same pattern as
// getAttendanceSummary, on top of (not instead of) the student-id scoping —
// belt and suspenders on the one collection that has the cached-string trap.
exports.getAttendanceReports = async (req, res) => {
  try {
    const end = req.query.endDate ? new Date(req.query.endDate) : new Date();
    end.setHours(23, 59, 59, 999);
    const start = req.query.startDate ? new Date(req.query.startDate) : new Date(end);
    if (!req.query.startDate) start.setDate(start.getDate() - 30);
    start.setHours(0, 0, 0, 0);

    // Applicants (pending/rejected) never attended anything — an attendance
    // row for one is always 0/0/0/null%, which reads as broken data rather
    // than "not applicable". Same exclusion as studentController's
    // roster=true (see getStudents), just unconditional here since this
    // report has no reason to ever include them.
    const studentFilter = { ...req.campusFilter, status: { $nin: ['pending', 'rejected'] } };
    if (req.query.batch) studentFilter.batch = req.query.batch;

    const students = await Student.find(studentFilter, 'name rollNumber batch')
      .populate('batch', 'schedule course')
      .sort({ name: 1 })
      .lean();

    if (students.length === 0) {
      return res.status(200).json({ rows: [], startDate: start, endDate: end });
    }

    const attendanceFilter = { student: { $in: students.map((s) => s._id) }, date: { $gte: start, $lte: end } };
    if (req.user.role !== 'super_admin') {
      const campus = await Campus.findById(req.user.campus_id).select('name');
      attendanceFilter.campus = campus?.name || '__no_campus__';
    }

    const grouped = await StudentAttendance.aggregate([
      { $match: attendanceFilter },
      { $group: { _id: { student: '$student', status: '$status' }, count: { $sum: 1 } } },
    ]);

    const countsByStudent = new Map();
    for (const g of grouped) {
      const sid = String(g._id.student);
      if (!countsByStudent.has(sid)) countsByStudent.set(sid, { present: 0, absent: 0, leave: 0 });
      countsByStudent.get(sid)[g._id.status] = g.count;
    }

    const rows = students.map((s) => {
      const c = countsByStudent.get(String(s._id)) || { present: 0, absent: 0, leave: 0 };
      const denominator = c.present + c.absent;
      const percentage = denominator > 0 ? Math.round((c.present / denominator) * 1000) / 10 : null;
      return {
        studentId: s._id,
        name: s.name,
        rollNumber: s.rollNumber,
        batch: s.batch ? { _id: s.batch._id, schedule: s.batch.schedule, course: s.batch.course } : null,
        present: c.present,
        absent: c.absent,
        leave: c.leave,
        percentage,
      };
    });

    return res.status(200).json({ rows, startDate: start, endDate: end });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load attendance reports', error: err.message });
  }
};

// Individual day-by-day records for one student in range — the drill-down
// behind getAttendanceReports' per-student rollup, needed because there's
// no single "the record" to edit from an aggregated Present/Absent/Leave
// count alone. Scoped through Student first (a real campus ref), same
// belt-and-suspenders as getAttendanceReports: the resulting records' own
// cached campus name is checked too, in case a student was ever reassigned
// campuses after a record was written under the old one.
exports.getStudentAttendanceRecords = async (req, res) => {
  try {
    const { studentId } = req.params;
    const student = await Student.findOne({ _id: studentId, ...req.campusFilter }).select('name campus');
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const end = req.query.endDate ? new Date(req.query.endDate) : new Date();
    end.setHours(23, 59, 59, 999);
    const start = req.query.startDate ? new Date(req.query.startDate) : new Date(end);
    if (!req.query.startDate) start.setDate(start.getDate() - 30);
    start.setHours(0, 0, 0, 0);

    const filter = { student: studentId, date: { $gte: start, $lte: end } };
    if (req.user.role !== 'super_admin') {
      const campus = await Campus.findById(req.user.campus_id).select('name');
      filter.campus = campus?.name || '__no_campus__';
    }

    const records = await StudentAttendance.find(filter).sort({ date: -1 }).lean();
    return res.status(200).json({ records });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load attendance records', error: err.message });
  }
};

// Corrects an existing record's status — an update, not a create, since
// StudentAttendance already enforces one record per {student, date}
// (unique index). E.g. a trainer marked someone absent and the campus
// manager later sees a leave slip. Every change is audit-logged with the
// old and new status in the summary, same "describe the change in prose"
// convention as studentController.updateStudent's drop/re-enroll cascade —
// AuditLog has no structured before/after fields.
exports.updateAttendanceRecord = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['present', 'absent', 'leave'].includes(status)) {
      return res.status(400).json({ message: 'status must be present, absent, or leave' });
    }

    const record = await StudentAttendance.findById(req.params.id);
    if (!record) return res.status(404).json({ message: 'Attendance record not found' });

    // StudentAttendance.campus is a cached name String (see model) — for a
    // sub_admin, resolve their own campus to a name and compare against the
    // record's cached string directly, same pattern as getAttendance/
    // getAttendanceSummary. super_admin skips this and can correct any
    // record.
    if (req.user.role !== 'super_admin') {
      const campus = await Campus.findById(req.user.campus_id).select('name');
      if (record.campus !== campus?.name) {
        return res.status(404).json({ message: 'Attendance record not found' });
      }
    }

    if (record.status === status) {
      return res.status(200).json({ record });
    }

    const oldStatus = record.status;
    record.status = status;
    await record.save();

    logAudit({
      actor: req.user,
      action: 'update',
      resourceType: 'StudentAttendance',
      resourceId: record._id,
      summary: `Changed "${record.studentName}"'s attendance on ${record.date.toDateString()} from ${oldStatus} to ${status}`,
      resourceCampus: await resolveCampusIdByName(record.campus),
    });

    return res.status(200).json({ record });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update attendance record', error: err.message });
  }
};
