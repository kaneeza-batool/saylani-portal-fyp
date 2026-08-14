require('dotenv').config();

const mongoose = require('mongoose');
const Student = require('../models/Student');
const Course = require('../models/Course');
const Question = require('../models/Question');
const Answer = require('../models/Answer');

const WEB_DEV_QUESTIONS = [
  {
    title: 'When should I use useEffect vs useLayoutEffect?',
    body: "I keep seeing both in React docs and tutorials. What's actually the practical difference, and when would using the wrong one cause a bug?",
    moduleTag: 'React Fundamentals',
    answers: [
      {
        body: "useLayoutEffect runs synchronously right after DOM mutations, before the browser paints — useEffect runs after paint. Use useLayoutEffect only when you need to measure/mutate the DOM before the user sees a flicker (e.g. reading an element's size). For almost everything else (data fetching, subscriptions), useEffect is correct and won't block painting.",
        accepted: true,
      },
      {
        body: "Rule of thumb from my trainer: default to useEffect always, and only reach for useLayoutEffect if you actually see a visual flash/jump that useEffect doesn't fix.",
      },
    ],
  },
  {
    title: 'CSS Grid vs Flexbox — how do I decide which to use?',
    body: 'For the Responsive Design module assignment, is there a rule for picking Grid over Flexbox or vice versa, or is it just preference?',
    moduleTag: 'Responsive Design (Flexbox & Grid)',
    answers: [
      {
        body: "Flexbox is one-dimensional (row OR column) — great for navbars, button groups, anything that flows in one direction. Grid is two-dimensional — use it when you're laying out both rows AND columns together, like a card gallery or a full page layout.",
        accepted: true,
      },
    ],
  },
  {
    title: "Why does my fetch() call show data in console.log but the state doesn't update?",
    body: "I'm calling setUsers(data) right after fetch resolves, and I can see the data logged correctly, but the UI still shows the old (empty) list.",
    moduleTag: 'Asynchronous JS (Promises, async/await)',
    answers: [
      {
        body: 'Most common cause: you\'re setting state with the raw Response object instead of the parsed body. Double check you have `const data = await res.json();` before calling setUsers(data) — missing that `await` is an easy one to miss.',
      },
    ],
  },
];

const AI_DS_QUESTIONS = [
  {
    title: 'What exactly is overfitting, and how do I know if my model has it?',
    body: 'My training accuracy is 98% but the model does badly on new data. Is that overfitting, and how would I fix it?',
    moduleTag: 'Machine Learning',
    answers: [
      {
        body: 'Yes, that gap between high training accuracy and poor test/validation accuracy is the classic sign of overfitting — the model memorized the training data instead of learning general patterns. Try: more training data, regularization (L1/L2), dropout if it\'s a neural net, or a simpler model with fewer parameters.',
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
      },
    ],
  },
];

async function seedCourseQuestions(course, questionDefs, authors) {
  const existing = await Question.countDocuments({ course: course._id });
  if (existing > 0) {
    console.log(`  ${course.name}: ${existing} questions already exist. Skipping.`);
    return;
  }

  let authorIndex = 0;
  function nextAuthor() {
    const author = authors[authorIndex % authors.length];
    authorIndex += 1;
    return author;
  }

  for (const def of questionDefs) {
    const questionAuthor = nextAuthor();
    const question = await Question.create({
      student: questionAuthor._id,
      course: course._id,
      title: def.title,
      body: def.body,
      moduleTag: def.moduleTag,
      upvoteCount: Math.floor(Math.random() * 6),
    });

    for (const a of def.answers) {
      const answerAuthor = nextAuthor();
      await Answer.create({
        question: question._id,
        authorRole: 'student',
        authorModelName: 'Student',
        author: answerAuthor._id,
        authorName: answerAuthor.fullName,
        body: a.body,
        upvoteCount: a.accepted ? 3 + Math.floor(Math.random() * 5) : Math.floor(Math.random() * 4),
        isAcceptedAnswer: !!a.accepted,
      });
    }
  }

  console.log(`  ${course.name}: seeded ${questionDefs.length} questions.`);
}

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);

  const webDev = await Course.findOne({ name: 'Web Development' });
  const aiDs = await Course.findOne({ name: 'AI & Data Science' });
  if (!webDev || !aiDs) {
    console.error('Courses not found. Run "npm run seed:courses" first.');
    process.exit(1);
  }

  // Reuse real seeded students as question/answer authors — no need for
  // throwaway fake identities when 26 real ones already exist.
  const authors = await Student.find({ cnic: { $regex: '^3520' } }).limit(6);
  const mainStudent = await Student.findOne({ cnic: '4550476281307' });
  if (mainStudent) authors.unshift(mainStudent);

  if (authors.length < 2) {
    console.error('Not enough seeded students found. Run "npm run seed:batch-students" first.');
    process.exit(1);
  }

  console.log('Seeding Ask-a-Doubt sample data...');
  await seedCourseQuestions(webDev, WEB_DEV_QUESTIONS, authors);
  await seedCourseQuestions(aiDs, AI_DS_QUESTIONS, authors);

  await mongoose.disconnect();
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err.message);
    process.exit(1);
  });
