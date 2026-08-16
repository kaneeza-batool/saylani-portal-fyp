const StudentPortalQuiz = require('../models/StudentPortalQuiz');
const StudentPortalQuizAttempt = require('../models/StudentPortalQuizAttempt');
const StudentPortalAssignment = require('../models/StudentPortalAssignment');
const StudentPortalAssignmentSubmission = require('../models/StudentPortalAssignmentSubmission');

// Same blend student-portal's own computeOverallProgress uses (see
// student-portal/server/utils/courseStats.js): % of the course's quizzes
// attempted + % of its assignments submitted, averaged, each counted only
// if the course actually has any — so the same student shows the same
// progress number here as on their own Student Portal, instead of every
// admin/trainer view either showing nothing or a differently-computed
// number. Deliberately omits the module-topics category student-portal's
// formula also has — CourseModule is confirmed dead/always-empty for real
// students (see student-portal's own progressController comment), so
// mirroring it here would only ever contribute a no-op; left out rather
// than adding a mirror model for a collection nothing ever populates.
//
// Batched across every student passed in — one query per resource type,
// not one round-trip per student, same efficiency shape
// trainerStudentsController.listMyStudents already uses for attendance/quiz/
// assignment lookups.
//
// `students`: [{ _id, course }, ...]. Returns Map<studentId string, percentage>.
async function computeCourseProgress(students) {
  const withCourse = students.filter((s) => s.course);
  if (withCourse.length === 0) return new Map();

  const studentIds = withCourse.map((s) => s._id);
  const courses = [...new Set(withCourse.map((s) => s.course))];

  const [quizzes, attempts, assignments, submissions] = await Promise.all([
    StudentPortalQuiz.find({ course: { $in: courses } }, 'course').lean(),
    StudentPortalQuizAttempt.find({ student: { $in: studentIds } }, 'student quiz').lean(),
    StudentPortalAssignment.find({ course: { $in: courses } }, 'course').lean(),
    StudentPortalAssignmentSubmission.find({ student: { $in: studentIds } }, 'student assignment').lean(),
  ]);

  const quizCountByCourse = new Map();
  for (const q of quizzes) quizCountByCourse.set(q.course, (quizCountByCourse.get(q.course) || 0) + 1);
  const assignmentCountByCourse = new Map();
  for (const a of assignments) assignmentCountByCourse.set(a.course, (assignmentCountByCourse.get(a.course) || 0) + 1);

  // Not scoped to the student's own course here — matches student-portal's
  // own formula exactly, which relies on the same implicit invariant (a
  // student only ever has one course, so every attempt/submission of theirs
  // already belongs to it) rather than an explicit course filter.
  const attemptedQuizzesByStudent = new Map();
  for (const a of attempts) {
    const sid = String(a.student);
    if (!attemptedQuizzesByStudent.has(sid)) attemptedQuizzesByStudent.set(sid, new Set());
    attemptedQuizzesByStudent.get(sid).add(String(a.quiz));
  }
  const submittedAssignmentsByStudent = new Map();
  for (const s of submissions) {
    const sid = String(s.student);
    if (!submittedAssignmentsByStudent.has(sid)) submittedAssignmentsByStudent.set(sid, new Set());
    submittedAssignmentsByStudent.get(sid).add(String(s.assignment));
  }

  const result = new Map();
  for (const student of withCourse) {
    const sid = String(student._id);
    const totalQuizzes = quizCountByCourse.get(student.course) || 0;
    const totalAssignments = assignmentCountByCourse.get(student.course) || 0;
    const attemptedCount = attemptedQuizzesByStudent.get(sid)?.size || 0;
    const submittedCount = submittedAssignmentsByStudent.get(sid)?.size || 0;

    const categories = [];
    if (totalQuizzes > 0) categories.push(Math.min(attemptedCount, totalQuizzes) / totalQuizzes);
    if (totalAssignments > 0) categories.push(Math.min(submittedCount, totalAssignments) / totalAssignments);

    const percentage = categories.length
      ? Math.round((categories.reduce((sum, v) => sum + v, 0) / categories.length) * 100)
      : 0;
    result.set(sid, percentage);
  }
  return result;
}

module.exports = { computeCourseProgress };
