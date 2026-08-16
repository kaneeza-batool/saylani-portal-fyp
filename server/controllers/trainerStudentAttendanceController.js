// Attendance a trainer marks FOR their students — distinct from
// trainerAttendanceController.js, which tracks a trainer's own check-in/
// check-out (a completely different feature; same "trainer" word, wrong
// file to touch, hence the more specific name here).
const Student = require('../models/Student');
const StudentAttendance = require('../models/StudentAttendance');

// Course-scoped, same reasoning as trainerAssignmentController.js — Student
// has no batch/Slot field, so "the roster for this batch" really means
// "enrolled students in this course," the actual relationship the schema
// supports.
exports.getRosterForDate = async (req, res) => {
  try {
    const { course, date } = req.query;
    if (!course || !date) return res.status(400).json({ message: 'course and date are required.' });

    const dayStart = new Date(new Date(date).toDateString());

    const [students, existing] = await Promise.all([
      Student.find({ course, status: { $in: ['enrolled', 'completed'] } }, 'name rollNumber').sort({ name: 1 }).lean(),
      StudentAttendance.find({ course, date: dayStart }).lean(),
    ]);

    const existingByStudent = new Map(existing.map((r) => [String(r.student), r]));

    // Default to 'present' for anyone with no record yet for this date —
    // matches the existing admin-side marking UX (studentAttendanceController
    // .markMultiple), which is opt-out (mark exceptions) rather than
    // opt-in (mark everyone one by one).
    const roster = students.map((s) => {
      const record = existingByStudent.get(String(s._id));
      return {
        student: { _id: s._id, name: s.name, rollNumber: s.rollNumber },
        status: record?.status || 'present',
        alreadyMarked: Boolean(record),
      };
    });

    return res.status(200).json({ roster });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load roster', error: err.message });
  }
};

// Bulk upsert — one StudentAttendance document per student per day (schema
// already enforces this with a unique {student, date} index), campus
// cached from each student's real campus the same way the admin-side
// markMultiple does, not left blank.
exports.markAttendance = async (req, res) => {
  try {
    const { course, date, records } = req.body;
    if (!course || !date || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ message: 'course, date, and records are required.' });
    }

    const dayStart = new Date(new Date(date).toDateString());
    const studentIds = records.map((r) => r.studentId);
    const students = await Student.find({ _id: { $in: studentIds } }).populate('campus', 'name').lean();
    const studentById = new Map(students.map((s) => [String(s._id), s]));

    const ops = records
      .filter((r) => studentById.has(r.studentId))
      .map((r) => {
        const student = studentById.get(r.studentId);
        return {
          updateOne: {
            filter: { student: student._id, date: dayStart },
            update: {
              $set: {
                student: student._id,
                studentName: student.name,
                rollNumber: student.rollNumber,
                course,
                campus: student.campus?.name || '',
                date: dayStart,
                status: r.status,
              },
            },
            upsert: true,
          },
        };
      });

    if (ops.length) await StudentAttendance.bulkWrite(ops);

    return res.status(200).json({ marked: ops.length });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to mark attendance', error: err.message });
  }
};
