const Assignment = require('../models/Assignment');
const AssignmentSubmission = require('../models/AssignmentSubmission');
const FeeVoucher = require('../models/FeeVoucher');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const Enrollment = require('../models/Enrollment');
require('../models/Course'); // registers the 'Course' model so .populate('course') resolves it
const {
  computeAttendanceStat,
  computeAssignmentStat,
  computeProgressStat,
  computeBatchProgressAverage,
  computeCourseLeaderboard,
} = require('../utils/courseStats');

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function daysUntil(dueDate) {
  return Math.ceil((new Date(dueDate).getTime() - Date.now()) / MS_PER_DAY);
}

exports.getDashboard = async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentId = req.student._id;

    const enrollment = await Enrollment.findOne({ student: studentId, course: courseId }).populate(
      'course'
    );
    if (!enrollment) return res.status(404).json({ message: 'Not enrolled in this course' });

    const [attendance, assignmentStat, recentFees, assignments, quizzes] = await Promise.all([
      computeAttendanceStat(studentId, courseId),
      computeAssignmentStat(studentId, courseId),
      FeeVoucher.find({ student: studentId, courseId }).sort({ dueDate: -1 }).limit(3),
      Assignment.find({ courseId }).sort({ dueDate: 1 }),
      Quiz.find({ courseId }).sort({ createdAt: 1 }),
    ]);

    const assignmentIds = assignments.map((a) => a._id);
    const submissions = await AssignmentSubmission.find(
      { student: studentId, assignment: { $in: assignmentIds } },
      'assignment'
    );
    const submittedIds = new Set(submissions.map((s) => s.assignment.toString()));
    const upcomingAssignments = assignments
      .filter((a) => !submittedIds.has(a._id.toString()))
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 5)
      .map((a) => ({
        _id: a._id,
        title: a.title,
        dueDate: a.dueDate,
        daysUntilDue: daysUntil(a.dueDate),
        isHackathon: a.isHackathon,
      }));

    const attempts = await QuizAttempt.find({
      student: studentId,
      quiz: { $in: quizzes.map((q) => q._id) },
    });
    const attemptedQuizIds = new Set(attempts.map((a) => a.quiz.toString()));
    const upcomingQuizzes = quizzes
      .filter((q) => !attemptedQuizIds.has(q._id.toString()))
      .slice(0, 5)
      .map((q) => ({
        _id: q._id,
        title: q.title,
        module: q.module,
        questionCount: q.questions.length,
        durationMinutes: q.durationMinutes,
      }));

    return res.status(200).json({
      attendance,
      assignment: assignmentStat,
      activeCourse: {
        _id: enrollment.course._id,
        name: enrollment.course.name,
        category: enrollment.course.category,
        batch: enrollment.batch,
        rollNumber: enrollment.rollNumber,
        campus: enrollment.campus,
        city: enrollment.city,
        progressPercent: enrollment.progressPercent,
      },
      classDays: enrollment.course.classDays,
      recentFees,
      tabs: {
        assignments: upcomingAssignments,
        quizzes: upcomingQuizzes,
        events: [], // stub — no Events feature exists yet
      },
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
