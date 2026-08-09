const Student = require('../models/Student');
const StudentAttendance = require('../models/StudentAttendance');

function startOfToday() {
  return new Date(new Date().toDateString());
}

exports.lookupStudent = async (req, res) => {
  try {
    const student = await Student.findOne({ rollNumber: req.params.rollNumber }).populate('campus', 'name city');
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
    const student = await Student.findOne({ rollNumber }).populate('campus', 'name');
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

    const students = await Student.find({ rollNumber: { $in: rollNumbers } }).populate('campus', 'name');
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

    return res.status(201).json({
      marked: created.length,
      skipped: students.length - created.length,
      notFound: rollNumbers.length - students.length,
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to mark attendance', error: err.message });
  }
};

exports.getAttendance = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const { search, status } = req.query;

    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (search && search.trim()) {
      // campus here is StudentAttendance's own cached-name String (snapshotted
      // at mark time above), not a ref — safe to regex-match directly.
      filter.$or = [
        { studentName: new RegExp(search.trim(), 'i') },
        { campus: new RegExp(search.trim(), 'i') },
        { course: new RegExp(search.trim(), 'i') },
      ];
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
