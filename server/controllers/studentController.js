const Student = require('../models/Student');
const Slot = require('../models/Slot');
const { logAudit } = require('../utils/auditLogger');

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Shared by create/update. `batchId` is falsy/omitted-safe (returns null
// batch, no error). Never trusts the client on scope: a sub_admin can only
// point a student at a Slot in their own campus, regardless of what the
// request body claims — checked against the Slot's real campus, not the
// campus the client says it picked. Also checked against `targetCampusId`
// (the campus the student will actually end up in after this write) so a
// batch can't silently end up pointing at a different campus than its
// student.
async function resolveBatchAssignment(user, targetCampusId, batchId) {
  if (!batchId) return { ok: true, batch: null };

  const slot = await Slot.findById(batchId).select('campus');
  if (!slot) return { ok: false, status: 400, message: 'Batch not found' };

  if (user.role !== 'super_admin' && String(slot.campus) !== String(user.campus_id)) {
    return { ok: false, status: 403, message: 'You can only assign batches within your own campus' };
  }
  if (targetCampusId && String(slot.campus) !== String(targetCampusId)) {
    return { ok: false, status: 400, message: "Batch does not belong to the student's campus" };
  }
  return { ok: true, batch: slot._id };
}

exports.getStudents = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const { search, status, roster } = req.query;

    const filter = { ...req.campusFilter };
    // roster=true excludes admissions applicants (pending/rejected) — opt-in
    // so this endpoint's default behavior (used by super-admin StudentsPage
    // and the sub-admin Dashboard KPI, neither of which sends it) is
    // unchanged. A specific `status` still narrows further/overrides it.
    if (roster === 'true') {
      filter.status = { $nin: ['pending', 'rejected'] };
    }
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (search && search.trim()) {
      const re = new RegExp(escapeRegex(search.trim()), 'i');
      filter.$or = [{ name: re }, { cnic: re }, { phone: re }, { email: re }];
    }

    const [students, total] = await Promise.all([
      Student.find(filter)
        .populate('campus', 'name city')
        .populate('batch', 'schedule course')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Student.countDocuments(filter),
    ]);

    return res.status(200).json({
      students,
      total,
      page,
      limit,
      pages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load students', error: err.message });
  }
};

exports.getStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).populate('campus', 'name city').populate('batch', 'schedule course');
    if (!student) return res.status(404).json({ message: 'Student not found' });
    return res.status(200).json({ student });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load student', error: err.message });
  }
};

exports.createStudent = async (req, res) => {
  try {
    const { name, father, cnic, phone, email, course, campus, status, address, batch } = req.body;
    if (!name || !father || !cnic || !phone || !email || !course || !campus) {
      return res.status(400).json({
        message: 'name, father, cnic, phone, email, course, and campus are required',
      });
    }

    const batchResult = await resolveBatchAssignment(req.user, campus, batch);
    if (!batchResult.ok) return res.status(batchResult.status).json({ message: batchResult.message });

    const student = await Student.create({
      name,
      father,
      cnic,
      phone,
      email,
      course,
      campus,
      batch: batchResult.batch,
      status: status || 'enrolled',
      address,
      payment: 'pending',
    });

    logAudit({
      actor: req.user,
      action: 'create',
      resourceType: 'Student',
      resourceId: student._id,
      summary: `Created student "${student.name}"`,
      resourceCampus: student.campus,
    });
    return res.status(201).json({ student });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'A student with this CNIC already exists' });
    }
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    return res.status(500).json({ message: 'Failed to create student', error: err.message });
  }
};

exports.updateStudent = async (req, res) => {
  try {
    const { name, father, cnic, phone, email, course, campus, status, payment, address, batch } = req.body;

    // sub_admin can only ever target students in their own campus (see
    // req.campusFilter above), but the payload itself could still carry a
    // different campus id — drop it silently rather than let them reassign
    // a student out of their campus, or error on a form just re-submitting
    // the student's existing (unchanged) campus value.
    const updates = { name, father, cnic, phone, email, course, status, payment, address };
    if (req.user.role === 'super_admin') {
      updates.campus = campus;
    }

    // batch is optional and only touched when the client actually sent a
    // `batch` key — omitting it from the payload must not wipe an existing
    // assignment. sub_admin's target campus is always their own (they can
    // only reach students already inside req.campusFilter); super_admin's
    // target campus is whatever this same request just set above.
    if (batch !== undefined) {
      let targetCampusId = req.user.role === 'super_admin' ? campus : req.user.campus_id;
      if (req.user.role === 'super_admin' && !targetCampusId) {
        const existing = await Student.findById(req.params.id).select('campus').lean();
        targetCampusId = existing?.campus;
      }
      const batchResult = await resolveBatchAssignment(req.user, targetCampusId, batch);
      if (!batchResult.ok) return res.status(batchResult.status).json({ message: batchResult.message });
      updates.batch = batchResult.batch;
    }

    const student = await Student.findOneAndUpdate(
      { _id: req.params.id, ...req.campusFilter },
      updates,
      { new: true, runValidators: true, context: 'query' }
    );

    if (!student) return res.status(404).json({ message: 'Student not found' });
    logAudit({
      actor: req.user,
      action: 'update',
      resourceType: 'Student',
      resourceId: student._id,
      summary: `Updated student "${student.name}"`,
      resourceCampus: student.campus,
    });
    return res.status(200).json({ student });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'A student with this CNIC already exists' });
    }
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    return res.status(500).json({ message: 'Failed to update student', error: err.message });
  }
};

exports.deleteStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    logAudit({
      actor: req.user,
      action: 'delete',
      resourceType: 'Student',
      resourceId: student._id,
      summary: `Deleted student "${student.name}"`,
      resourceCampus: student.campus,
    });
    return res.status(200).json({ message: 'Student deleted' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to delete student', error: err.message });
  }
};
