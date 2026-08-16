const { computeCourseLeaderboard } = require('../utils/courseStats');

// LIVE ONLY — this must always query live, never cache or hardcode student
// count or ranking. computeCourseLeaderboard re-ranks every peer student
// from real StudentAttendance/QuizAttempt records on every call, so adding,
// removing, or updating any student's records changes this list on the very
// next request — nothing here is precomputed or stored. One course per
// student now (see Student.js), so this is scoped by the logged-in
// student's own course string, not a URL courseId.
exports.getFullLeaderboard = async (req, res) => {
  try {
    const course = req.student.course;
    const studentId = req.student._id;
    if (!course) return res.status(200).json({ batchSize: 0, students: [], you: studentId.toString() });

    const students = await computeCourseLeaderboard(course);

    return res.status(200).json({
      batchSize: students.length,
      students,
      you: studentId.toString(),
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load leaderboard', error: err.message });
  }
};
