const Student = require('../models/Student');
const Trainer = require('../models/Trainer');
const Campus = require('../models/Campus');
const Course = require('../models/Course');
const Employer = require('../models/Employer');
const Quiz = require('../models/Quiz');
const Job = require('../models/Job');
const Slot = require('../models/Slot');

// Real aggregate counts across the core collections — not a "generate PDF"
// stub, since there's no defined report format/library wired up for that.
exports.getSummary = async (_req, res) => {
  try {
    const [
      totalStudents,
      studentsByStatus,
      totalTrainers,
      totalCampuses,
      totalCourses,
      totalEmployers,
      employersByStatus,
      totalQuizzes,
      totalJobs,
      totalSlots,
    ] = await Promise.all([
      Student.countDocuments(),
      Student.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Trainer.countDocuments(),
      Campus.countDocuments(),
      Course.countDocuments(),
      Employer.countDocuments(),
      Employer.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Quiz.countDocuments(),
      Job.countDocuments(),
      Slot.countDocuments(),
    ]);

    const toMap = (rows) => Object.fromEntries(rows.map((r) => [r._id, r.count]));

    return res.status(200).json({
      totals: {
        students: totalStudents,
        trainers: totalTrainers,
        campuses: totalCampuses,
        courses: totalCourses,
        employers: totalEmployers,
        quizzes: totalQuizzes,
        jobs: totalJobs,
        slots: totalSlots,
      },
      studentsByStatus: toMap(studentsByStatus),
      employersByStatus: toMap(employersByStatus),
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load report summary', error: err.message });
  }
};
