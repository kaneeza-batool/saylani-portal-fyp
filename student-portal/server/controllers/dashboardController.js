const StudentAttendance = require('../models/StudentAttendance');
require('../models/Slot'); // registers 'Slot' so .populate('batch') resolves it
const Enrollment = require('../models/Enrollment');
require('../models/Course'); // registers the 'Course' model so .populate('course') resolves it
const { computeProgressStat, computeBatchProgressAverage, computeCourseLeaderboard } = require('../utils/courseStats');

// One course per student now (see Student.js) — course, batch, payment,
// campus, and rollNumber all live directly on the shared Student document.
// Enrollment/Course/Assignment/Quiz/FeeVoucher/CourseModule are dead: no
// data has ever been migrated into those collections for the shared
// database (see attendanceController's equivalent fix), so every section
// that used to read from them has no data source and returns an empty
// array/null instead of querying tables that can only ever be empty.
// Attendance is the one real, live number here — computed the same way the
// admin side does: present / (present + absent), leave excluded from the
// denominator.
exports.getDashboard = async (req, res) => {
  try {
    const student = req.student;
    await student.populate({ path: 'batch', select: 'schedule' });

    const records = await StudentAttendance.find({ student: student._id, course: student.course });
    const present = records.filter((r) => r.status === 'present').length;
    const absent = records.filter((r) => r.status === 'absent').length;
    const denominator = present + absent;
    const attendance = {
      total: records.length,
      present,
      percentage: denominator > 0 ? Math.round((present / denominator) * 1000) / 10 : 0,
    };

    const activeCourse = student.course
      ? {
          name: student.course,
          batch: student.batch?.schedule || null,
          rollNumber: student.rollNumber || null,
          campus: student.campus?.name || null,
          city: null,
          progressPercent: 0,
        }
      : null;

    return res.status(200).json({
      attendance,
      assignment: { total: 0, submitted: 0 },
      activeCourse,
      classDays: [],
      recentFees: [],
      tabs: { assignments: [], quizzes: [], events: [] },
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load dashboard', error: err.message });
  }
};

// LIVE ONLY — this must always query live, never cache or hardcode student
// count or a batch average. computeBatchProgressAverage re-reads every
// enrolled student's real CourseModule records on every call; there is no
// stored/precomputed batch number anywhere for this endpoint to fall back on.
exports.getProgressInsight = async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentId = req.student._id;

    const enrollment = await Enrollment.findOne({ student: studentId, course: courseId });
    if (!enrollment) return res.status(404).json({ message: 'Not enrolled in this course' });

    const [progress, batch] = await Promise.all([
      computeProgressStat(studentId, courseId),
      computeBatchProgressAverage(courseId),
    ]);

    const diff = progress.percentage - batch.average;

    let message;
    let tone;
    if (diff >= 0) {
      tone = 'ahead';
      message =
        diff === 0
          ? `🎯 You're right at your batch average of ${batch.average}%.`
          : `🎯 You're ${diff}% ahead of your batch average.`;
    } else {
      tone = 'behind';
      const targetCompleted = Math.ceil((batch.average / 100) * progress.totalTopics);
      const topicsNeeded = Math.max(1, targetCompleted - progress.completedTopics);
      message = `📈 Complete ${topicsNeeded} more topic${topicsNeeded === 1 ? '' : 's'} to reach ${batch.average}%.`;
    }

    return res.status(200).json({
      studentProgress: progress.percentage,
      batchAvgProgress: batch.average,
      batchSize: batch.batchSize,
      diff,
      tone,
      message,
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load progress insight', error: err.message });
  }
};

// LIVE ONLY — this must always query live, never cache or hardcode student
// count or ranking. computeCourseLeaderboard re-ranks every enrolled
// student from real Attendance/QuizAttempt records on every call — this is
// the compact Dashboard-card view (top 5 + the caller's own row); the full
// ranked list lives at GET /api/leaderboard/:courseId (leaderboardController).
exports.getLeaderboardPosition = async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentId = req.student._id;

    const enrollment = await Enrollment.findOne({ student: studentId, course: courseId });
    if (!enrollment) return res.status(404).json({ message: 'Not enrolled in this course' });

    const leaderboard = await computeCourseLeaderboard(courseId);
    const you = leaderboard.find((row) => row.studentId === studentId.toString()) || null;

    return res.status(200).json({
      batchSize: leaderboard.length,
      top: leaderboard.slice(0, 5),
      you,
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load leaderboard position', error: err.message });
  }
};
