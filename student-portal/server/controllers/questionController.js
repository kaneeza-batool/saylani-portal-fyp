const Question = require('../models/Question');
const Answer = require('../models/Answer');

async function answerCountsFor(questionIds) {
  const rows = await Answer.aggregate([
    { $match: { question: { $in: questionIds } } },
    { $group: { _id: '$question', count: { $sum: 1 }, hasAccepted: { $max: '$isAcceptedAnswer' } } },
  ]);
  const byQuestion = new Map(rows.map((r) => [r._id.toString(), r]));
  return byQuestion;
}

// List questions for the logged-in student's course — sortable by newest
// (default) or most upvoted. Strictly scoped to their own course
// (`course: req.student.course`), never global.
exports.getQuestions = async (req, res) => {
  try {
    const { sort, search } = req.query;

    const filter = { course: req.student.course };
    if (search?.trim()) {
      filter.title = { $regex: search.trim(), $options: 'i' };
    }

    const sortSpec = sort === 'top' ? { upvoteCount: -1, createdAt: -1 } : { createdAt: -1 };

    const questions = await Question.find(filter).sort(sortSpec).populate('student', 'name avatarUrl');
    const counts = await answerCountsFor(questions.map((q) => q._id));

    const results = questions
      .filter((q) => q.student)
      .map((q) => {
        const stat = counts.get(q._id.toString());
        return {
          _id: q._id,
          title: q.title,
          moduleTag: q.moduleTag,
          upvoteCount: q.upvoteCount,
          createdAt: q.createdAt,
          authorName: q.student.name,
          authorAvatarUrl: q.student.avatarUrl || null,
          answerCount: stat?.count || 0,
          hasAcceptedAnswer: !!stat?.hasAccepted,
        };
      });

    return res.status(200).json({ questions: results });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load questions', error: err.message });
  }
};

exports.createQuestion = async (req, res) => {
  try {
    const { title, body, moduleTag } = req.body;

    if (!title?.trim() || !body?.trim()) {
      return res.status(400).json({ message: 'Title and body are required' });
    }

    const question = await Question.create({
      student: req.student._id,
      course: req.student.course,
      title: title.trim(),
      body: body.trim(),
      moduleTag: moduleTag?.trim() || '',
    });

    return res.status(201).json({ question });
  } catch (err) {
    if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
    return res.status(500).json({ message: 'Failed to post question', error: err.message });
  }
};

// Full question + every answer, accepted answer pinned first, the rest
// sorted by upvotes. Scoped to the requesting student's own course so a
// question from another course can't be opened by guessing its ID.
exports.getQuestionDetail = async (req, res) => {
  try {
    const question = await Question.findOne({
      _id: req.params.questionId,
      course: req.student.course,
    }).populate('student', 'name avatarUrl');
    if (!question || !question.student) return res.status(404).json({ message: 'Question not found' });

    const answers = await Answer.find({ question: question._id }).sort({
      isAcceptedAnswer: -1,
      upvoteCount: -1,
      createdAt: 1,
    });

    return res.status(200).json({
      question: {
        _id: question._id,
        title: question.title,
        body: question.body,
        moduleTag: question.moduleTag,
        upvoteCount: question.upvoteCount,
        createdAt: question.createdAt,
        authorName: question.student.name,
        authorAvatarUrl: question.student.avatarUrl || null,
        isOwnQuestion: question.student._id.toString() === req.student._id.toString(),
      },
      answers: answers.map((a) => ({
        _id: a._id,
        body: a.body,
        authorName: a.authorName,
        authorRole: a.authorRole,
        upvoteCount: a.upvoteCount,
        isAcceptedAnswer: a.isAcceptedAnswer,
        createdAt: a.createdAt,
      })),
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load question', error: err.message });
  }
};

exports.createAnswer = async (req, res) => {
  try {
    const { questionId } = req.params;
    const { body } = req.body;
    if (!body?.trim()) return res.status(400).json({ message: 'Answer body is required' });

    const question = await Question.findOne({ _id: questionId, course: req.student.course });
    if (!question) return res.status(404).json({ message: 'Question not found' });

    const answer = await Answer.create({
      question: questionId,
      authorRole: 'student',
      authorModelName: 'Student',
      author: req.student._id,
      authorName: req.student.name,
      body: body.trim(),
    });

    return res.status(201).json({ answer });
  } catch (err) {
    if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
    return res.status(500).json({ message: 'Failed to post answer', error: err.message });
  }
};

// Simple increment — no per-student vote tracking/toggle, matching the
// scope of the plain `upvoteCount` number field on the model (no separate
// vote-ledger collection was asked for). Good enough for this feature's
// scope; a real dedup-per-student mechanism would need its own model.
exports.upvoteQuestion = async (req, res) => {
  try {
    const question = await Question.findOneAndUpdate(
      { _id: req.params.questionId, course: req.student.course },
      { $inc: { upvoteCount: 1 } },
      { new: true }
    );
    if (!question) return res.status(404).json({ message: 'Question not found' });
    return res.status(200).json({ upvoteCount: question.upvoteCount });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to upvote question', error: err.message });
  }
};

// Scoped through the parent question's course — Answer itself has no course
// field (see Answer.js), so without this join any logged-in student could
// upvote an answer belonging to another course's question by guessing its
// ID, the same class of cross-course leak upvoteQuestion/createAnswer above
// already guard against directly.
exports.upvoteAnswer = async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.answerId).populate('question', 'course');
    if (!answer || !answer.question || answer.question.course !== req.student.course) {
      return res.status(404).json({ message: 'Answer not found' });
    }

    answer.upvoteCount += 1;
    await answer.save();

    return res.status(200).json({ upvoteCount: answer.upvoteCount });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to upvote answer', error: err.message });
  }
};

// Only the ORIGINAL QUESTION's author may accept an answer — mirrors
// Stack Overflow. Unsets any previously-accepted answer on the same
// question first, since only one can be accepted at a time.
exports.markAcceptedAnswer = async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.answerId);
    if (!answer) return res.status(404).json({ message: 'Answer not found' });

    const question = await Question.findById(answer.question);
    if (!question) return res.status(404).json({ message: 'Question not found' });
    if (question.student.toString() !== req.student._id.toString()) {
      return res.status(403).json({ message: 'Only the question author can mark an accepted answer' });
    }

    await Answer.updateMany({ question: question._id }, { isAcceptedAnswer: false });
    answer.isAcceptedAnswer = true;
    await answer.save();

    return res.status(200).json({ answer });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to mark accepted answer', error: err.message });
  }
};
