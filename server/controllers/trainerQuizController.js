const StudentPortalQuiz = require('../models/StudentPortalQuiz');
const { logAudit } = require('../utils/auditLogger');

// Fixed course list, verbatim from the canonical Student.COURSES (main
// app's server/models/Student.js) — a quiz's `course` has to be one of
// these exact strings to ever match a student (Student Portal scopes
// quizzes by `Quiz.find({ course: req.student.course })`, an exact string
// match, not a lookup by id). No Course collection involved on either side.
const COURSES = [
  'Web Development',
  'AI & Data Science',
  'Graphic Designing',
  'Mobile App Development (Flutter)',
  'Digital Marketing',
  'UI/UX Design',
  'Cybersecurity Fundamentals',
];

exports.listCourses = async (_req, res) => {
  return res.status(200).json({ items: COURSES.map((name) => ({ name })) });
};

exports.listMyQuizzes = async (req, res) => {
  try {
    const quizzes = await StudentPortalQuiz.find({ createdByTrainer: req.user._id }).sort({ createdAt: -1 }).lean();
    return res.status(200).json({ items: quizzes });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load your quizzes', error: err.message });
  }
};

// Every question needs exactly 4 options and a real explanation — matches
// student-portal's own Quiz schema validation (see StudentPortalQuiz.js),
// so a quiz that fails here would have failed there too; surfacing it at
// creation time is strictly better than a trainer discovering it only if
// the underlying document ever got hand-edited.
function validateQuestions(questions) {
  if (!Array.isArray(questions) || questions.length === 0) return 'At least one question is required.';
  for (const [i, q] of questions.entries()) {
    if (!q.questionText?.trim()) return `Question ${i + 1}: text is required.`;
    if (!Array.isArray(q.options) || q.options.length !== 4 || q.options.some((o) => !o?.trim())) {
      return `Question ${i + 1}: exactly 4 non-empty options are required.`;
    }
    if (typeof q.correctOptionIndex !== 'number' || q.correctOptionIndex < 0 || q.correctOptionIndex > 3) {
      return `Question ${i + 1}: select which option is correct.`;
    }
    if (!q.explanation?.trim()) return `Question ${i + 1}: an explanation is required (shown to students after they submit).`;
  }
  return null;
}

exports.createQuiz = async (req, res) => {
  try {
    const { course, module, title, durationMinutes, questions } = req.body;
    if (!course || !module?.trim() || !title?.trim() || !durationMinutes) {
      return res.status(400).json({ message: 'Course, module, title, and duration are all required.' });
    }
    if (!COURSES.includes(course)) {
      return res.status(400).json({ message: 'Selected course is not recognized.' });
    }

    const questionError = validateQuestions(questions);
    if (questionError) return res.status(400).json({ message: questionError });

    const quiz = await StudentPortalQuiz.create({
      course,
      module: module.trim(),
      title: title.trim(),
      durationMinutes,
      questions: questions.map((q) => ({
        questionText: q.questionText.trim(),
        options: q.options.map((o) => o.trim()),
        correctOptionIndex: q.correctOptionIndex,
        marks: q.marks || 1,
        explanation: q.explanation.trim(),
      })),
      createdByTrainer: req.user._id,
    });

    logAudit({
      actor: req.user,
      action: 'create',
      resourceType: 'StudentPortalQuiz',
      resourceId: quiz._id,
      summary: `Created quiz "${quiz.title}" for ${quiz.course}`,
    });

    return res.status(201).json({ quiz });
  } catch (err) {
    if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
    return res.status(500).json({ message: 'Failed to create quiz', error: err.message });
  }
};
