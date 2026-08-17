// Read-only view of attendance a trainer's students have — the trainer no
// longer MARKS it here (that moved entirely to Super Admin/Sub-Admin's QR
// scanner, see attendanceScanController.js); this file now only backs
// AttendancePage.jsx's day/course roster view. Distinct from
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
