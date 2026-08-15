const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');

exports.getQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find({ course: req.student.course }).sort({ createdAt: 1 });
    const attempts = await QuizAttempt.find({ student: req.student._id }).sort({ attemptNumber: -1 });

    const latestByQuiz = new Map();
    const countByQuiz = new Map();
    for (const attempt of attempts) {
      const key = attempt.quiz.toString();
      countByQuiz.set(key, (countByQuiz.get(key) || 0) + 1);
      if (!latestByQuiz.has(key)) latestByQuiz.set(key, attempt);
    }

    const results = quizzes.map((quiz) => {
      const key = quiz._id.toString();
      const latest = latestByQuiz.get(key) || null;
      return {
        _id: quiz._id,
        module: quiz.module,
        title: quiz.title,
        questionCount: quiz.questions.length,
        durationMinutes: quiz.durationMinutes,
        attempts: countByQuiz.get(key) || 0,
        score: latest ? latest.score : null,
        totalMarks: quiz.totalMarks,
        percentage: latest ? latest.percentage : null,
        status: latest ? latest.status : null,
        lastAttemptId: latest ? latest._id : null,
      };
    });

    return res.status(200).json({ quizzes: results });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load quizzes', error: err.message });
  }
};

exports.getQuizForTaking = async (req, res) => {
  try {
    const { id } = req.params;
    const quiz = await Quiz.findOne({ _id: id, course: req.student.course });
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    return res.status(200).json({
      quiz: {
        _id: quiz._id,
        module: quiz.module,
        title: quiz.title,
        durationMinutes: quiz.durationMinutes,
        totalMarks: quiz.totalMarks,
        questions: quiz.questions.map((q) => ({
          _id: q._id,
          questionText: q.questionText,
          options: q.options,
          marks: q.marks,
        })),
      },
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load quiz', error: err.message });
  }
};

exports.startAttempt = async (req, res) => {
  try {
    const { id } = req.params;
    const quiz = await Quiz.findOne({ _id: id, course: req.student.course }, 'durationMinutes');
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    const previousAttempts = await QuizAttempt.countDocuments({ student: req.student._id, quiz: quiz._id });

    return res.status(200).json({
      startedAt: new Date(),
      attemptNumber: previousAttempts + 1,
      durationMinutes: quiz.durationMinutes,
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to start attempt', error: err.message });
  }
};

exports.submitAttempt = async (req, res) => {
  try {
    const { id } = req.params;
    const { answers, startedAt, tabSwitchCount, fullscreenExitCount } = req.body;

    const quiz = await Quiz.findOne({ _id: id, course: req.student.course });
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    if (!Array.isArray(answers) || answers.length !== quiz.questions.length) {
      return res.status(400).json({ message: 'Answers must match the number of questions' });
    }

    // Score is always computed server-side from the quiz's own answer key —
    // the client only ever sends selected option indices, never a score.
    let score = 0;
    quiz.questions.forEach((q, i) => {
      if (answers[i] === q.correctOptionIndex) score += q.marks;
    });

    const percentage = quiz.totalMarks > 0 ? Math.round((score / quiz.totalMarks) * 100) : 0;
    const status = percentage >= QuizAttempt.PASS_THRESHOLD_PERCENT ? 'passed' : 'failed';

    const previousAttempts = await QuizAttempt.countDocuments({ student: req.student._id, quiz: quiz._id });

    const attempt = await QuizAttempt.create({
      student: req.student._id,
      quiz: quiz._id,
      answers,
      score,
      percentage,
      status,
      tabSwitchCount: tabSwitchCount || 0,
      fullscreenExitCount: fullscreenExitCount || 0,
      startedAt: startedAt ? new Date(startedAt) : new Date(),
      submittedAt: new Date(),
      attemptNumber: previousAttempts + 1,
    });

    return res.status(201).json({ attemptId: attempt._id });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to submit attempt', error: err.message });
  }
};

exports.getAttemptResult = async (req, res) => {
  try {
    const attempt = await QuizAttempt.findById(req.params.attemptId);
    if (!attempt || attempt.student.toString() !== req.student._id.toString()) {
      return res.status(404).json({ message: 'Attempt not found' });
    }

    const quiz = await Quiz.findById(attempt.quiz);

    const correctCount = attempt.answers.filter((a, i) => a === quiz.questions[i]?.correctOptionIndex).length;
    const unansweredCount = attempt.answers.filter((a) => a === null || a === undefined).length;
    const incorrectCount = quiz.questions.length - correctCount - unansweredCount;

    // Full per-question breakdown for the results review — explanations are
    // safe to reveal here since the attempt is already submitted and scored.
    const questions = quiz.questions.map((q, i) => {
      const selectedIndex = attempt.answers[i] ?? null;
      const isCorrect = selectedIndex === q.correctOptionIndex;
      return {
        questionText: q.questionText,
        options: q.options,
        correctOptionIndex: q.correctOptionIndex,
        selectedIndex,
        isCorrect,
        explanation: q.explanation,
      };
    });

    return res.status(200).json({
      attempt: {
        _id: attempt._id,
        score: attempt.score,
        totalMarks: quiz.totalMarks,
        percentage: attempt.percentage,
        status: attempt.status,
        correctCount,
        incorrectCount,
        unansweredCount,
        tabSwitchCount: attempt.tabSwitchCount,
        fullscreenExitCount: attempt.fullscreenExitCount,
        attemptNumber: attempt.attemptNumber,
      },
      quiz: {
        _id: quiz._id,
        course: quiz.course,
        title: quiz.title,
        module: quiz.module,
        questions,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load result', error: err.message });
  }
};
