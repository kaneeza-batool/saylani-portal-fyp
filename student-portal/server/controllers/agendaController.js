const Assignment = require('../models/Assignment');
const AssignmentSubmission = require('../models/AssignmentSubmission');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');

const DAY_MS = 24 * 60 * 60 * 1000;

// One course per student now (see Student.js) — course is a plain name
// string directly on the shared Student document, not an Enrollment row,
// and Assignment/Quiz key off that same string `course` field, not a
// `courseId`. This previously still queried the dead Enrollment collection
// (never populated for a real student — see dashboardController's identical
// note) and filtered Assignment/Quiz by a `courseId` field neither schema
// has, so this endpoint always returned an empty agenda for every student
// regardless of real due dates/quizzes. Migrated to the same course-string
// pattern already applied to every other controller (dashboard, progress,
// attendance, assignment, quiz, leaderboard, courses, resources).
//
// Class-day items were dropped for the same reason dashboardController's
// `classDays` is hardcoded to `[]`: there's no live per-course schedule
// data source left (Course.classDays is on the same dead Course
// collection), so this only surfaces real assignment/quiz activity rather
// than fabricating a schedule from nothing.
exports.getMyWeekAgenda = async (req, res) => {
  try {
    const studentId = req.student._id;
    const course = req.student.course;

    const now = new Date();
    const rangeEnd = new Date(now.getTime() + 7 * DAY_MS);
    const items = [];

    if (course) {
      const assignments = await Assignment.find({
        course,
        dueDate: { $gte: now, $lte: rangeEnd },
      }).sort({ dueDate: 1 });

      const submissions = await AssignmentSubmission.find({
        student: studentId,
        assignment: { $in: assignments.map((a) => a._id) },
      });
      const submittedIds = new Set(submissions.map((s) => s.assignment.toString()));

      for (const a of assignments) {
        items.push({
          type: 'assignment',
          courseId: a._id,
          courseName: course,
          title: a.title,
          date: a.dueDate,
          meta: submittedIds.has(a._id.toString()) ? 'Already submitted' : 'Due',
          link: '/assignment',
        });
      }

      const quizzes = await Quiz.find({ course });
      const attempts = await QuizAttempt.find(
        { student: studentId, quiz: { $in: quizzes.map((q) => q._id) } },
        'quiz'
      );
      const attemptedIds = new Set(attempts.map((a) => a.quiz.toString()));

      for (const q of quizzes) {
        if (attemptedIds.has(q._id.toString())) continue;
        items.push({
          type: 'quiz',
          courseId: q._id,
          courseName: course,
          title: q.title,
          date: now,
          meta: 'Available now',
          link: '/quiz',
        });
      }
    }

    items.sort((a, b) => new Date(a.date) - new Date(b.date));

    return res.status(200).json({ items, rangeStart: now, rangeEnd });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load agenda', error: err.message });
  }
};
