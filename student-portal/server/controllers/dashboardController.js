const StudentAttendance = require('../models/StudentAttendance');
require('../models/Slot'); // registers 'Slot' so .populate('batch') resolves it
const FeeVoucher = require('../models/FeeVoucher');
const Assignment = require('../models/Assignment');
const AssignmentSubmission = require('../models/AssignmentSubmission');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const { computeOverallProgress } = require('../utils/courseStats');

// One course per student now (see Student.js) — course, batch, payment,
// campus, and rollNumber all live directly on the shared Student document.
// Enrollment/Course/CourseModule are still dead: no data has ever been
// migrated into those collections for the shared database (see
// attendanceController's equivalent fix), so every section that used to
// read from them has no data source and returns an empty array/null
// instead of querying tables that can only ever be empty. FeeVoucher,
// Assignment, and Quiz are the exceptions — real, seeded data (see
// utils/seedFeeVouchers.js, utils/seedAssignments.js, utils/seedQuizzes.js),
// scoped by student/student.course only, same as Attendance below.
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

    // Was hardcoded to 0 — the Certificate Ready banner on this page checks
    // this field and could never show. Same blend the Progress page itself
    // uses (module topics + quiz attempts + assignment submissions).
    const overallProgress = student.course ? await computeOverallProgress(student._id, student.course) : null;

    const activeCourse = student.course
      ? {
          name: student.course,
          batch: student.batch?.schedule || null,
          rollNumber: student.rollNumber || null,
          campus: student.campus?.name || null,
          city: student.campus?.city || null,
          progressPercent: overallProgress?.percentage ?? 0,
        }
      : null;

    // Same 3-row limit and dueDate-desc ordering the pre-rewrite version
    // used — matches what FeeTable (DashboardPage.jsx) already renders,
    // full history lives on the Payment page's "View All".
    const recentFees = await FeeVoucher.find({ student: student._id }).sort({ dueDate: -1 }).limit(3);

    const courseAssignments = await Assignment.find({ course: student.course }).sort({ dueDate: 1 });
    const assignmentIds = courseAssignments.map((a) => a._id);
    const submissions = await AssignmentSubmission.find(
      { student: student._id, assignment: { $in: assignmentIds } },
      'assignment status'
    );
    const submittedIds = new Set(
      submissions.filter((s) => ['submitted', 'late_submitted', 'approved', 'not_approved'].includes(s.status)).map((s) => s.assignment.toString())
    );
    const assignment = { total: courseAssignments.length, submitted: submittedIds.size };

    // Top 3 not-yet-submitted assignments, soonest due first — same shape
    // TabsPanel (DashboardPage.jsx) already expects from the old per-course
    // endpoint (_id/title/daysUntilDue).
    const now = Date.now();
    const pendingAssignments = courseAssignments
      .filter((a) => !submittedIds.has(a._id.toString()))
      .slice(0, 3)
      .map((a) => ({
        _id: a._id,
        title: a.title,
        daysUntilDue: Math.ceil((new Date(a.dueDate).getTime() - now) / (1000 * 60 * 60 * 24)),
      }));

    const courseQuizzes = await Quiz.find({ course: student.course }).sort({ createdAt: 1 });
    const quizAttempts = await QuizAttempt.find(
      { student: student._id, quiz: { $in: courseQuizzes.map((q) => q._id) } },
      'quiz'
    );
    const attemptedQuizIds = new Set(quizAttempts.map((a) => a.quiz.toString()));

    // Top 3 not-yet-attempted quizzes — same shape TabsPanel (DashboardPage.jsx)
    // already expects from the old per-course endpoint (_id/title/module/durationMinutes).
    const pendingQuizzes = courseQuizzes
      .filter((q) => !attemptedQuizIds.has(q._id.toString()))
      .slice(0, 3)
      .map((q) => ({
        _id: q._id,
        title: q.title,
        module: q.module,
        durationMinutes: q.durationMinutes,
      }));

    return res.status(200).json({
      attendance,
      assignment,
      activeCourse,
      classDays: [],
      recentFees,
      tabs: { assignments: pendingAssignments, quizzes: pendingQuizzes, events: [] },
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load dashboard', error: err.message });
  }
};
