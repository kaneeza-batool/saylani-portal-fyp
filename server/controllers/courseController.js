const Enrollment = require('../models/Enrollment');
require('../models/Course'); // registers the 'Course' model so .populate('course') resolves it

exports.getEnrolledCourses = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ student: req.student._id })
      .populate('course')
      .sort({ enrolledAt: 1 });

    const results = enrollments
      .filter((e) => e.course) // guard against a dangling ref if a Course was ever deleted
      .map((e) => ({
        _id: e.course._id,
        name: e.course.name,
        category: e.course.category,
        durationWeeks: e.course.durationWeeks,
        batch: e.batch,
        rollNumber: e.rollNumber,
        campus: e.campus,
        city: e.city,
        status: e.status,
        progressPercent: e.progressPercent,
        enrolledAt: e.enrolledAt,
      }));

    return res.status(200).json({ courses: results });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load enrolled courses', error: err.message });
  }
};
