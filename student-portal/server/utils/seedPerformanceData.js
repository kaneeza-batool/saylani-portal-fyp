const Attendance = require('../models/Attendance');
const QuizAttempt = require('../models/QuizAttempt');
const CourseModule = require('../models/CourseModule');

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Seeds `totalClasses` real Attendance docs for a student in a course, with
// present/leave/absent counts derived from targetPercent (present/total is
// exactly what the leaderboard/dashboard read, so this is deterministic up
// to rounding — leave vs absent split is cosmetic and doesn't affect it).
// Returns the actual achieved percentage, or null if already seeded.
async function seedAttendanceForStudent(studentId, courseId, totalClasses, targetPercent) {
  const existing = await Attendance.countDocuments({ student: studentId, courseId });
  if (existing > 0) return null;

  const presentCount = Math.round((totalClasses * targetPercent) / 100);
  const leaveCount = Math.min(randInt(2, 6), totalClasses - presentCount);
  const absentCount = Math.max(totalClasses - presentCount - leaveCount, 0);

  const statuses = shuffle([
    ...Array(presentCount).fill('present'),
    ...Array(leaveCount).fill('leave'),
    ...Array(absentCount).fill('absent'),
  ]);

  const docs = statuses.map((status, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (statuses.length - i) * 2);
    return { student: studentId, courseId, date, status, classNumber: i + 1 };
  });

  await Attendance.insertMany(docs);
  return Math.round((presentCount / totalClasses) * 1000) / 10;
}

// Seeds one QuizAttempt per quiz for a student, aiming for targetPercent on
// each (± jitterRange, so a "quiz average" of e.g. 70% doesn't mean every
// single quiz lands at exactly 70%). Pass jitterRange: 0 for a deterministic
// exact score — used by the champion seed to guarantee a top rank rather
// than leaving it to chance. Returns the actual achieved average, or null
// if already seeded.
async function seedQuizAttemptsForStudent(studentId, quizzes, targetPercent, jitterRange = 5) {
  if (quizzes.length === 0) return null;

  const existing = await QuizAttempt.countDocuments({
    student: studentId,
    quiz: { $in: quizzes.map((q) => q._id) },
  });
  if (existing > 0) return null;

  const scores = [];
  for (const quiz of quizzes) {
    const questionCount = quiz.questions.length;
    const jitter = jitterRange > 0 ? randInt(-jitterRange, jitterRange) : 0;
    const attemptPercent = Math.min(100, Math.max(0, targetPercent + jitter));
    const correctCount = Math.round((questionCount * attemptPercent) / 100);

    const order = shuffle([...Array(questionCount).keys()]);
    const correctSet = new Set(order.slice(0, correctCount));

    const answers = quiz.questions.map((q, i) =>
      correctSet.has(i) ? q.correctOptionIndex : (q.correctOptionIndex + 1) % 4
    );

    const score = quiz.questions.reduce(
      (sum, q, i) => sum + (answers[i] === q.correctOptionIndex ? q.marks : 0),
      0
    );
    const percentage = quiz.totalMarks > 0 ? Math.round((score / quiz.totalMarks) * 100) : 0;
    const status = percentage >= QuizAttempt.PASS_THRESHOLD_PERCENT ? 'passed' : 'failed';

    const startedAt = new Date();
    startedAt.setDate(startedAt.getDate() - randInt(3, 60));
    const submittedAt = new Date(startedAt.getTime() + randInt(8, Math.max(quiz.durationMinutes, 8)) * 60 * 1000);

    await QuizAttempt.create({
      student: studentId,
      quiz: quiz._id,
      answers,
      score,
      percentage,
      status,
      tabSwitchCount: 0,
      fullscreenExitCount: 0,
      startedAt,
      submittedAt,
      attemptNumber: 1,
    });

    scores.push(percentage);
  }

  return Math.round(scores.reduce((sum, v) => sum + v, 0) / scores.length);
}

// Seeds a single synthetic "Coursework Progress" module with `topicCount`
// generic topics for a student, marking the first N as complete to hit
// targetPercent. Topic names don't matter — no synthetic student's Progress
// page is ever viewed (they can't log in), only the aggregate percentage is
// read, by the live batch-average query in courseStats.js. Returns the
// actual achieved percentage, or null if already seeded.
async function seedProgressForStudent(studentId, courseId, targetPercent, topicCount) {
  const existing = await CourseModule.countDocuments({ student: studentId, courseId });
  if (existing > 0) return null;

  const completedCount = Math.round((topicCount * targetPercent) / 100);
  const topics = Array.from({ length: topicCount }, (_, i) => ({
    topicName: `Topic ${i + 1}`,
    isCompleted: i < completedCount,
  }));

  await CourseModule.create({
    student: studentId,
    courseId,
    moduleName: 'Coursework Progress',
    order: 1,
    topics,
  });

  return Math.round((completedCount / topicCount) * 100);
}

module.exports = {
  randInt,
  seedAttendanceForStudent,
  seedQuizAttemptsForStudent,
  seedProgressForStudent,
};
