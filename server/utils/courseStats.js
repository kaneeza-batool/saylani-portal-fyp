const Attendance = require('../models/Attendance');
const Assignment = require('../models/Assignment');
const AssignmentSubmission = require('../models/AssignmentSubmission');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const CourseModule = require('../models/CourseModule');
const Enrollment = require('../models/Enrollment');

async function computeAttendanceStat(studentId, courseId) {
  const records = await Attendance.find({ student: studentId, courseId });
  const total = records.length;
  const present = records.filter((r) => r.status === 'present').length;
  const percentage = total > 0 ? Math.round((present / total) * 1000) / 10 : 0;
  return { total, present, percentage };
}

async function computeAssignmentStat(studentId, courseId) {
  const assignments = await Assignment.find({ courseId }, '_id');
  const assignmentIds = assignments.map((a) => a._id);
  const submissions = await AssignmentSubmission.find(
    { student: studentId, assignment: { $in: assignmentIds } },
    'status'
  );
  const submitted = submissions.filter((s) =>
    ['submitted', 'late_submitted', 'approved', 'not_approved'].includes(s.status)
  ).length;
  return { total: assignments.length, submitted };
}

async function computeProgressStat(studentId, courseId) {
  const modules = await CourseModule.find({ student: studentId, courseId });
  const totalTopics = modules.reduce((sum, m) => sum + m.topics.length, 0);
  const completedTopics = modules.reduce(
    (sum, m) => sum + m.topics.filter((t) => t.isCompleted).length,
    0
  );
  const percentage = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
  return { totalTopics, completedTopics, percentage };
}

// LIVE ONLY — must always query live across real Enrollment/CourseModule
// records, never cache or hardcode the batch size or average. This is the
// single source of truth for "batch average progress" used by the Progress
// Insight widget; every enrolled student (including the caller) counts once.
async function computeBatchProgressAverage(courseId) {
  const enrollments = await Enrollment.find({ course: courseId }, 'student');
  const studentIds = enrollments.map((e) => e.student);
  if (studentIds.length === 0) return { average: 0, batchSize: 0 };

  const modules = await CourseModule.find({ courseId, student: { $in: studentIds } });
  const byStudent = new Map();
  for (const m of modules) {
    const key = m.student.toString();
    const agg = byStudent.get(key) || { completed: 0, total: 0 };
    agg.total += m.topics.length;
    agg.completed += m.topics.filter((t) => t.isCompleted).length;
    byStudent.set(key, agg);
  }

  const percentages = studentIds.map((id) => {
    const agg = byStudent.get(id.toString());
    if (!agg || agg.total === 0) return 0;
    return Math.round((agg.completed / agg.total) * 100);
  });

  const average = Math.round(percentages.reduce((sum, v) => sum + v, 0) / percentages.length);
  return { average, batchSize: percentages.length };
}

// LIVE ONLY — must always query live across real Enrollment/Attendance/
// QuizAttempt records, never cache or hardcode the ranking or student count.
// This is the single source of truth for the batch leaderboard, used by
// both the Dashboard's compact card and the full /leaderboard/:courseId
// page — recomputed fresh on every call so adding, removing, or updating
// any student's records changes the ranking on the very next request.
//
// combinedScore = 50% attendance% + 50% quiz average. A student who hasn't
// attempted any quiz in the course gets 0 for that half (not excluded) —
// unlike computeQuizAvg above, a missing quiz score is a real performance
// gap here, not just an unknown, since every student is ranked on the same
// two-term formula.
async function computeCourseLeaderboard(courseId) {
  const enrollments = await Enrollment.find({ course: courseId }).populate(
    'student',
    'fullName avatarUrl'
  );
  const enrolledStudents = enrollments.filter((e) => e.student);

  const quizIds = (await Quiz.find({ courseId }, '_id')).map((q) => q._id);

  const rows = await Promise.all(
    enrolledStudents.map(async (enrollment) => {
      const studentId = enrollment.student._id;

      const attendanceRecords = await Attendance.find({ student: studentId, courseId });
      const total = attendanceRecords.length;
      const present = attendanceRecords.filter((r) => r.status === 'present').length;
      const attendancePercentage = total > 0 ? Math.round((present / total) * 1000) / 10 : 0;

      let quizAverage = 0;
      if (quizIds.length > 0) {
        const attempts = await QuizAttempt.find({
          student: studentId,
          quiz: { $in: quizIds },
        }).sort({ attemptNumber: -1 });
        const latestByQuiz = new Map();
        for (const attempt of attempts) {
          const key = attempt.quiz.toString();
          if (!latestByQuiz.has(key)) latestByQuiz.set(key, attempt);
        }
        const scores = [...latestByQuiz.values()].map((a) => a.percentage);
        quizAverage =
          scores.length > 0 ? Math.round(scores.reduce((sum, v) => sum + v, 0) / scores.length) : 0;
      }

      const combinedScore = Math.round((attendancePercentage * 0.5 + quizAverage * 0.5) * 10) / 10;

      return {
        studentId: studentId.toString(),
        fullName: enrollment.student.fullName,
        avatarUrl: enrollment.student.avatarUrl || null,
        attendancePercentage,
        quizAverage,
        combinedScore,
      };
    })
  );

  rows.sort((a, b) => b.combinedScore - a.combinedScore);
  rows.forEach((row, i) => {
    row.rank = i + 1;
  });

  return rows;
}

module.exports = {
  computeAttendanceStat,
  computeAssignmentStat,
  computeProgressStat,
  computeBatchProgressAverage,
  computeCourseLeaderboard,
};
