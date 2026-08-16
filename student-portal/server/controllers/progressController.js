const CourseModule = require('../models/CourseModule');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const Assignment = require('../models/Assignment');
const AssignmentSubmission = require('../models/AssignmentSubmission');

// One course per student now (see Student.js) — courseId used to come from
// the URL (/progress/:courseId), but nothing in the current data model
// (Student.course is a plain name string, not a Course ObjectId) can
// actually produce a valid one anymore, so every real student's request hit
// this as literally the string "undefined" and Mongoose's cast to ObjectId
// 500'd. Scoped by student alone now, same "courseless" migration already
// applied to attendanceController/feeController/assignmentController/
// quizController — see Sidebar.jsx's NAV_ITEMS comment.
//
// Overall progress used to come ONLY from CourseModule topics — but that
// collection is never populated for a real student (see the seed scripts'
// own comments), so a student who actually attempted quizzes and submitted
// assignments still saw a permanently-stuck 0%, which is exactly what was
// reported. Overall percentage is now a blend of everything the student has
// actually done: module topics (if any exist), quiz attempts, and
// assignment submissions — each counted once it's real activity, not left
// waiting on a syllabus feature nothing populates yet.
exports.getProgress = async (req, res) => {
  try {
    const course = req.student.course;

    const [modules, totalQuizzes, attemptedQuizIds, totalAssignments, submittedAssignmentIds] = await Promise.all([
      CourseModule.find({ student: req.student._id }).sort({ order: 1 }),
      Quiz.countDocuments({ course }),
      QuizAttempt.distinct('quiz', { student: req.student._id }),
      Assignment.countDocuments({ course }),
      AssignmentSubmission.distinct('assignment', { student: req.student._id }),
    ]);

    const results = modules.map((m) => {
      const totalTopics = m.topics.length;
      const completedTopics = m.topics.filter((t) => t.isCompleted).length;
      const percentage = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

      return {
        _id: m._id,
        moduleName: m.moduleName,
        order: m.order,
        totalTopics,
        completedTopics,
        percentage,
        topics: m.topics.map((t) => ({
          _id: t._id,
          topicName: t.topicName,
          isCompleted: t.isCompleted,
        })),
      };
    });

    const totalTopics = results.reduce((sum, m) => sum + m.totalTopics, 0);
    const completedTopics = results.reduce((sum, m) => sum + m.completedTopics, 0);

    // Only blend in a category that actually has something to complete —
    // a course with zero quizzes shouldn't drag the average down just
    // because "0 of 0" would otherwise read as 0%.
    const categories = [
      totalTopics > 0 ? completedTopics / totalTopics : null,
      totalQuizzes > 0 ? Math.min(attemptedQuizIds.length, totalQuizzes) / totalQuizzes : null,
      totalAssignments > 0 ? Math.min(submittedAssignmentIds.length, totalAssignments) / totalAssignments : null,
    ].filter((v) => v !== null);

    const overallPercentage = categories.length
      ? Math.round((categories.reduce((sum, v) => sum + v, 0) / categories.length) * 100)
      : 0;

    return res.status(200).json({
      modules: results,
      overallPercentage,
      totalTopics,
      completedTopics,
      quizzes: { completed: attemptedQuizIds.length, total: totalQuizzes },
      assignments: { completed: submittedAssignmentIds.length, total: totalAssignments },
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load progress', error: err.message });
  }
};
