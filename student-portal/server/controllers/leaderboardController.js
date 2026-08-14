const Enrollment = require('../models/Enrollment');
const { computeCourseLeaderboard } = require('../utils/courseStats');

// LIVE ONLY — this must always query live, never cache or hardcode student
// count or ranking. computeCourseLeaderboard re-ranks every enrolled student
// from real Attendance/QuizAttempt records on every call, so adding,
// removing, or updating any student's records changes this list on the very
// next request — nothing here is precomputed or stored.
exports.getFullLeaderboard = async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentId = req.student._id;

    const enrollment = await Enrollment.findOne({ student: studentId, course: courseId });
    if (!enrollment) return res.status(404).json({ message: 'Not enrolled in this course' });

    const students = await computeCourseLeaderboard(courseId);

    return res.status(200).json({
      batchSize: students.length,
      students,
      you: studentId.toString(),
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load leaderboard', error: err.message });
  }
};
