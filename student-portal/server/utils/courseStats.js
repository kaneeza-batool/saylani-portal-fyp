const StudentAttendance = require('../models/StudentAttendance');
const Assignment = require('../models/Assignment');
const AssignmentSubmission = require('../models/AssignmentSubmission');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const CourseModule = require('../models/CourseModule');
const Student = require('../models/Student');

// One course per student now (see Student.js) — `course` here is always the
// plain name string, matched against StudentAttendance.course/Quiz.course/
// Assignment.course, never an Enrollment/Course ObjectId. This file used to
// query the dead Enrollment/Attendance(ObjectId-keyed) collections, which
// are never populated for a real student — every function here always
// returned an empty/zero result no matter what a student actually did,
// which is why Leaderboard and Certificate were effectively dead features.

async function computeAttendanceStat(studentId, course) {
  const records = await StudentAttendance.find({ student: studentId, course });
  const present = records.filter((r) => r.status === 'present').length;
  const absent = records.filter((r) => r.status === 'absent').length;
  // present/(present+absent), leave excluded — same formula used everywhere
  // else attendance is shown in this app (attendanceController, dashboardController).
  const denominator = present + absent;
  const percentage = denominator > 0 ? Math.round((present / denominator) * 1000) / 10 : 0;
  return { total: records.length, present, percentage };
}

// Latest attempt per quiz in the course, averaged.
async function computeQuizAverage(studentId, course) {
  const quizIds = (await Quiz.find({ course }, '_id')).map((q) => q._id);
  if (quizIds.length === 0) return 0;

  const attempts = await QuizAttempt.find({ student: studentId, quiz: { $in: quizIds } }).sort({
    attemptNumber: -1,
  });
  const latestByQuiz = new Map();
  for (const attempt of attempts) {
    const key = attempt.quiz.toString();
    if (!latestByQuiz.has(key)) latestByQuiz.set(key, attempt);
  }
  const scores = [...latestByQuiz.values()].map((a) => a.percentage);
  return scores.length > 0 ? Math.round(scores.reduce((sum, v) => sum + v, 0) / scores.length) : 0;
}

// Same blend progressController.getProgress computes inline (module topics +
// quiz attempts + assignment submissions, each counted only if that category
// has anything to complete) — factored out here so certificate eligibility
// agrees with what the Progress page itself shows. The old version of this
// function only looked at CourseModule topics, which are never populated for
// a real student, so eligibility could never reach 100% even for a student
// who'd genuinely finished every quiz and assignment.
async function computeOverallProgress(studentId, course) {
  const [modules, totalQuizzes, attemptedQuizIds, totalAssignments, submittedAssignmentIds] = await Promise.all([
    CourseModule.find({ student: studentId }),
    Quiz.countDocuments({ course }),
    QuizAttempt.distinct('quiz', { student: studentId }),
    Assignment.countDocuments({ course }),
    AssignmentSubmission.distinct('assignment', { student: studentId }),
  ]);

  const totalTopics = modules.reduce((sum, m) => sum + m.topics.length, 0);
  const completedTopics = modules.reduce((sum, m) => sum + m.topics.filter((t) => t.isCompleted).length, 0);

  const categories = [
    totalTopics > 0 ? completedTopics / totalTopics : null,
    totalQuizzes > 0 ? Math.min(attemptedQuizIds.length, totalQuizzes) / totalQuizzes : null,
    totalAssignments > 0 ? Math.min(submittedAssignmentIds.length, totalAssignments) / totalAssignments : null,
  ].filter((v) => v !== null);

  const percentage = categories.length
    ? Math.round((categories.reduce((sum, v) => sum + v, 0) / categories.length) * 100)
    : 0;

  return { percentage };
}

// LIVE ONLY — this must always query live, never cache or hardcode student
// count or ranking. Peer group is every non-applicant Student sharing this
// course string (the roster convention — status not pending/rejected), not
// the dead Enrollment collection. Recomputed fresh on every call so adding,
// removing, or updating any student's records changes the ranking on the
// very next request.
//
// combinedScore = 50% attendance% + 50% quiz average. A student who hasn't
// attempted any quiz in the course gets 0 for that half (not excluded) —
// a missing quiz score is a real performance gap here, unlike
// computeQuizAverage's "no data yet" 0.
async function computeCourseLeaderboard(course) {
  const students = await Student.find({ course, status: { $nin: ['pending', 'rejected'] } }).select(
    'name avatarUrl'
  );

  const quizIds = (await Quiz.find({ course }, '_id')).map((q) => q._id);

  const rows = await Promise.all(
    students.map(async (student) => {
      const attendance = await computeAttendanceStat(student._id, course);

      let quizAverage = 0;
      if (quizIds.length > 0) {
        const attempts = await QuizAttempt.find({
          student: student._id,
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

      const combinedScore = Math.round((attendance.percentage * 0.5 + quizAverage * 0.5) * 10) / 10;

      return {
        studentId: student._id.toString(),
        fullName: student.name,
        avatarUrl: student.avatarUrl || null,
        attendancePercentage: attendance.percentage,
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
  computeQuizAverage,
  computeOverallProgress,
  computeCourseLeaderboard,
};
