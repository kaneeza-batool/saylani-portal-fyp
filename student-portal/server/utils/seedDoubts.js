require('dotenv').config();

const mongoose = require('mongoose');
const Student = require('../models/Student');
const Trainer = require('../models/Trainer');
const Question = require('../models/Question');
const Answer = require('../models/Answer');

// One course per student now (see Student.js/Question.js) — no Course
// collection to seed against. `course` is matched against the real
// Student.course string, and a course's questions only get created if at
// least one real student in titan-portal is actually taking it.
//
// AI & Data Science is the main course this feature is demoed against, with
// real trainer-authored answers (see AI_DS_TRAINERS below). Web Development
// gets a couple of unanswered questions purely as a leak-test control — same
// reasoning as seedAssignments.js's UI/UX Design set — so "the per-course
// filter doesn't leak" has something real to check against.
const AI_DS_QUESTIONS = [
  {
    title: 'What exactly is overfitting, and how do I know if my model has it?',
    body: 'My training accuracy is 98% but the model does badly on new data. Is that overfitting, and how would I fix it?',
    moduleTag: 'Machine Learning',
    answers: [
      {
        body: 'Yes, that gap between high training accuracy and poor test/validation accuracy is the classic sign of overfitting — the model memorized the training data instead of learning general patterns. Try: more training data, regularization (L1/L2), dropout if it\'s a neural net, or a simpler model with fewer parameters.',
        byTrainer: true,
        accepted: true,
      },
      {
        body: "Also worth checking your train/test split — make sure there's no data leakage between the two sets, that alone can fake a huge accuracy gap.",
      },
    ],
  },
  {
    title: 'Difference between pandas .loc[] and .iloc[]?',
    body: 'I keep mixing these up during the Data Cleaning exercises. Both seem to select rows/columns but I get different errors depending on which I use.',
    moduleTag: 'Python for Data Science',
    answers: [
      {
        body: '.loc[] selects by LABEL (the actual index/column name), .iloc[] selects by INTEGER POSITION (0, 1, 2...) regardless of what the labels are. If your DataFrame index is just default integers they can look identical, but once you filter/reset/reindex, they diverge fast.',
        accepted: true,
      },
    ],
  },
  {
    title: 'How many layers should a neural network have for a beginner project?',
    body: "For the Deep Learning module's mini project, is there a rule of thumb for how deep to go, or do I just guess and tune?",
    moduleTag: 'Deep Learning',
    answers: [
      {
        body: 'For a beginner tabular/image classification project, start shallow — 2-3 hidden layers is plenty. Add depth only if a shallower network is clearly underfitting (both train and validation accuracy are low). More layers is not automatically better and just makes training slower to tune.',
        byTrainer: true,
      },
    ],
  },
  {
    title: 'Why does my confusion matrix look fine but the F1 score is still low?',
    body: 'Accuracy is 91% and the confusion matrix diagonal looks strong, but sklearn.metrics.f1_score keeps coming back around 0.4 on one class.',
    moduleTag: 'Machine Learning',
    answers: [], // open — no answers yet
  },
  {
    title: 'Best way to handle missing values before training — drop or impute?',
    body: "About a third of one column in my dataset is NaN. Is it ever fine to just drop those rows, or should I always impute?",
    moduleTag: 'Python for Data Science',
    answers: [
      {
        body: "Depends how much signal you'd lose. If it's under ~5% of rows and missingness looks random, dropping is fine and simpler. At a third of a column, dropping rows wastes too much data — impute instead (median for skewed numeric columns, mode for categorical), and consider adding a separate 'was_missing' flag column if the missingness itself might be informative.",
        byTrainer: true,
      },
    ],
  },
  {
    title: 'Is it normal for training loss to go up for a few epochs before it drops?',
    body: 'My loss curve dips, spikes back up around epoch 5, then resumes dropping. Model still converges fine by the end — is the spike a red flag?',
    moduleTag: 'Deep Learning',
    answers: [], // open — no answers yet
  },
];

const WEB_DEV_QUESTIONS = [
  {
    title: 'When should I use useEffect vs useLayoutEffect?',
    body: "I keep seeing both in React docs and tutorials. What's actually the practical difference?",
    moduleTag: 'React Fundamentals',
    answers: [],
  },
  {
    title: "Why does my fetch() call show data in console.log but the state doesn't update?",
    body: "I'm calling setUsers(data) right after fetch resolves, and I can see the data logged correctly, but the UI still shows the old (empty) list.",
    moduleTag: 'Asynchronous JS (Promises, async/await)',
    answers: [],
  },
];

// Real, active AI & Data Science trainers pulled from titan-portal — verified
// against the live Trainer collection rather than invented. (Ahmed Raza is a
// real AI & DS trainer too but is `status: inactive`, so deliberately left
// out of answer attribution.)
const AI_DS_TRAINER_NAMES = ['Waqas Ahmed', 'Nadia Malik'];

async function seedCourseQuestions(course, questionDefs, students, trainers) {
  const hasRealStudents = await Student.exists({ course });
  if (!hasRealStudents) {
    console.log(`  ${course}: no real students in titan-portal — skipping.`);
    return;
  }

  const existing = await Question.countDocuments({ course });
  if (existing > 0) {
    console.log(`  ${course}: ${existing} questions already exist. Skipping.`);
    return;
  }

  let studentIndex = 0;
  function nextStudent() {
    const s = students[studentIndex % students.length];
    studentIndex += 1;
    return s;
  }

  let trainerIndex = 0;
  function nextTrainer() {
    if (trainers.length === 0) return null;
    const t = trainers[trainerIndex % trainers.length];
    trainerIndex += 1;
    return t;
  }

  let answerCount = 0;
  for (const def of questionDefs) {
    const questionAuthor = nextStudent();
    const question = await Question.create({
      student: questionAuthor._id,
      course,
      title: def.title,
      body: def.body,
      moduleTag: def.moduleTag,
      upvoteCount: Math.floor(Math.random() * 6),
    });

    for (const a of def.answers) {
      const trainer = a.byTrainer ? nextTrainer() : null;
      const answerAuthor = trainer || nextStudent();

      await Answer.create({
        question: question._id,
        authorRole: trainer ? 'trainer' : 'student',
        authorModelName: trainer ? 'Trainer' : 'Student',
        author: answerAuthor._id,
        authorName: answerAuthor.name,
        body: a.body,
        upvoteCount: a.accepted ? 3 + Math.floor(Math.random() * 5) : Math.floor(Math.random() * 4),
        isAcceptedAnswer: !!a.accepted,
      });
      answerCount += 1;
    }
  }

  console.log(`  ${course}: seeded ${questionDefs.length} questions, ${answerCount} answers.`);
}

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);

  // Reuse real seeded students as question/answer authors — no need for
  // throwaway fake identities when real ones already exist.
  const aiDsStudents = await Student.find({ course: 'AI & Data Science' }).limit(6);
  const webDevStudents = await Student.find({ course: 'Web Development' }).limit(6);
  const aiDsTrainers = await Trainer.find({ name: { $in: AI_DS_TRAINER_NAMES }, course: 'AI & Data Science' });

  console.log('Seeding Ask-a-Doubt sample data...');

  if (aiDsStudents.length < 2) {
    console.log('  AI & Data Science: fewer than 2 real students found — skipping.');
  } else {
    await seedCourseQuestions('AI & Data Science', AI_DS_QUESTIONS, aiDsStudents, aiDsTrainers);
  }

  if (webDevStudents.length < 2) {
    console.log('  Web Development: fewer than 2 real students found — skipping.');
  } else {
    await seedCourseQuestions('Web Development', WEB_DEV_QUESTIONS, webDevStudents, []);
  }

  await mongoose.disconnect();
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err.message);
    process.exit(1);
  });
