// Attendance a trainer marks FOR their students — distinct from
// trainerAttendanceController.js, which tracks a trainer's own check-in/
// check-out (a completely different feature; same "trainer" word, wrong
// file to touch, hence the more specific name here).
const Slot = require('../models/Slot');
const Student = require('../models/Student');
const StudentAttendance = require('../models/StudentAttendance');
const { myBatchesFilter } = require('./trainerDashboardController');

// Backs the Attendance page's course dropdown — the trainer's own courses
// only, derived from their own batches (same ownership pattern as
// trainerStudentsController.listMyStudents), NOT the global 7-course
// catalog trainerQuizController.listCourses returns for Quiz Builder/
// Assignments. A course name isn't unique to one trainer — two different
// trainers can each own a batch called "Web Development" — so this list
// (and every check below) is scoped by the trainer's own Slot ownership,
// never by the course string alone.
exports.listMyAttendanceCourses = async (req, res) => {
  try {
    const slots = await Slot.find(myBatchesFilter(req.user), 'course').lean();
    const courses = [...new Set(slots.map((s) => s.course))].sort();
    return res.status(200).json({ items: courses.map((name) => ({ name })) });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load your courses', error: err.message });
  }
};

// The trainer's own batch id(s) for a given course name — the real
// ownership boundary. Returns [] if the trainer owns no batch of that
// course, which callers treat as a 403, not an empty-but-valid roster.
async function myBatchIdsForCourse(user, course) {
  const slots = await Slot.find({ ...myBatchesFilter(user), course }, '_id').lean();
  return slots.map((s) => s._id);
}

exports.getRosterForDate = async (req, res) => {
  try {
    const { course, date } = req.query;
    if (!course || !date) return res.status(400).json({ message: 'course and date are required.' });

    const batchIds = await myBatchIdsForCourse(req.user, course);
    if (batchIds.length === 0) {
      return res.status(403).json({ message: 'You can only take attendance for your own batches.' });
    }

    const dayStart = new Date(new Date(date).toDateString());

    const [students, existing] = await Promise.all([
      Student.find({ batch: { $in: batchIds }, status: { $in: ['enrolled', 'completed'] } }, 'name rollNumber')
        .sort({ name: 1 })
        .lean(),
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

    const batchIds = await myBatchIdsForCourse(req.user, course);
    if (batchIds.length === 0) {
      return res.status(403).json({ message: 'You can only take attendance for your own batches.' });
    }

    const dayStart = new Date(new Date(date).toDateString());
    const studentIds = records.map((r) => r.studentId);
    // Scoped to the trainer's own batch(es) for this course — a studentId
    // in the payload that isn't actually in one of those batches is
    // silently dropped below, same as an unrecognized id always was, not
    // trusted just because the course name matched.
    const students = await Student.find({ _id: { $in: studentIds }, batch: { $in: batchIds } })
      .populate('campus', 'name')
      .lean();
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

// Quick single-student mark — the trainer scans a student's own ID card QR
// (same payload StudentIdCardModal/QrCheckInModal already use:
// {org:'TITAN', type:'Student', id: rollNumber, name}) or types their roll
// number in by hand, and that one student is marked present immediately.
// Same ownership boundary as the bulk path: the roll number must belong to
// a student in one of the trainer's own batches for this course, or it's
// rejected rather than silently marking someone outside their roster.
exports.markByRollNumber = async (req, res) => {
  try {
    const { course, date, rollNumber } = req.body;
    if (!course || !date || !rollNumber) {
      return res.status(400).json({ message: 'course, date, and rollNumber are required.' });
    }

    const batchIds = await myBatchIdsForCourse(req.user, course);
    if (batchIds.length === 0) {
      return res.status(403).json({ message: 'You can only take attendance for your own batches.' });
    }

    const student = await Student.findOne({ rollNumber: Number(rollNumber), batch: { $in: batchIds } }).populate(
      'campus',
      'name'
    );
    if (!student) {
      return res.status(404).json({ message: `No student with roll number ${rollNumber} in this batch.` });
    }

    const dayStart = new Date(new Date(date).toDateString());
    const record = await StudentAttendance.findOneAndUpdate(
      { student: student._id, date: dayStart },
      {
        $set: {
          student: student._id,
          studentName: student.name,
          rollNumber: student.rollNumber,
          course,
          campus: student.campus?.name || '',
          date: dayStart,
          status: 'present',
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({ student: { _id: student._id, name: student.name, rollNumber: student.rollNumber }, record });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to mark attendance', error: err.message });
  }
};
