const Student = require('../models/Student');
const { logAudit } = require('../utils/auditLogger');

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

exports.getStudents = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const { search, status } = req.query;

    const filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (search && search.trim()) {
      const re = new RegExp(escapeRegex(search.trim()), 'i');
      filter.$or = [{ name: re }, { cnic: re }, { phone: re }, { email: re }];
    }

    const [students, total] = await Promise.all([
      Student.find(filter)
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
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    return res.status(200).json({ student });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load student', error: err.message });
  }
};

exports.createStudent = async (req, res) => {
  try {
    const { name, father, cnic, phone, email, course, campus, status, address } = req.body;
    if (!name || !father || !cnic || !phone || !email || !course || !campus) {
      return res.status(400).json({
        message: 'name, father, cnic, phone, email, course, and campus are required',
      });
    }

    const student = await Student.create({
      name,
      father,
      cnic,
      phone,
      email,
      course,
      campus,
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
    const { name, father, cnic, phone, email, course, campus, status, payment, address } = req.body;

    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { name, father, cnic, phone, email, course, campus, status, payment, address },
      { new: true, runValidators: true, context: 'query' }
    );

    if (!student) return res.status(404).json({ message: 'Student not found' });
    logAudit({
      actor: req.user,
      action: 'update',
      resourceType: 'Student',
      resourceId: student._id,
      summary: `Updated student "${student.name}"`,
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
    });
    return res.status(200).json({ message: 'Student deleted' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to delete student', error: err.message });
  }
};
