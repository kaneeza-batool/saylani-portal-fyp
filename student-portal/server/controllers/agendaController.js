const Enrollment = require('../models/Enrollment');
const Assignment = require('../models/Assignment');
const AssignmentSubmission = require('../models/AssignmentSubmission');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
require('../models/Course'); // registers 'Course' so .populate('course') resolves it

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Unified 7-day agenda across every enrolled course — assignments due,
// quizzes still available, and scheduled class days, merged into one
// chronological list. Quizzes have no due date in this schema (unlike
// assignments), so an un-attempted quiz shows as "available now" and
// sorts at today rather than a specific future date.
exports.getMyWeekAgenda = async (req, res) => {
  try {
    const studentId = req.student._id;
    const enrollments = await Enrollment.find({ student: studentId }).populate('course');
    const courses = enrollments
      .filter((e) => e.course)
      .map((e) => ({ id: e.course._id, name: e.course.name, classDays: e.course.classDays || [] }));

    const now = new Date();
    const rangeEnd = new Date(now.getTime() + 7 * DAY_MS);
    const items = [];

    for (const course of courses) {
      const assignments = await Assignment.find({
        courseId: course.id,
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
          courseId: course.id,
          courseName: course.name,
          title: a.title,
          date: a.dueDate,
          meta: submittedIds.has(a._id.toString()) ? 'Already submitted' : 'Due',
          link: `/assignment/${course.id}`,
        });
      }

      const quizzes = await Quiz.find({ courseId: course.id });
      const attempts = await QuizAttempt.find(
        { student: studentId, quiz: { $in: quizzes.map((q) => q._id) } },
        'quiz'
      );
      const attemptedIds = new Set(attempts.map((a) => a.quiz.toString()));

      for (const q of quizzes) {
        if (attemptedIds.has(q._id.toString())) continue;
        items.push({
          type: 'quiz',
          courseId: course.id,
          courseName: course.name,
          title: q.title,
          date: now,
          meta: 'Available now',
          link: `/quiz/${course.id}`,
        });
      }

      for (let i = 0; i < 7; i += 1) {
        const d = new Date(now.getTime() + i * DAY_MS);
        const weekday = WEEKDAY_NAMES[d.getDay()];
        if (course.classDays.includes(weekday)) {
          items.push({
            type: 'class',
            courseId: course.id,
            courseName: course.name,
            title: `${course.name} class`,
            date: d,
            meta: weekday,
            link: `/dashboard/${course.id}`,
          });
        }
      }
    }

    items.sort((a, b) => new Date(a.date) - new Date(b.date));

    return res.status(200).json({ items, rangeStart: now, rangeEnd });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load agenda', error: err.message });
  }
};
