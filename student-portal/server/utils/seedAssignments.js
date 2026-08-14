require('dotenv').config();

const mongoose = require('mongoose');
const Student = require('../models/Student');
const Course = require('../models/Course');
const Assignment = require('../models/Assignment');
const AssignmentSubmission = require('../models/AssignmentSubmission');

const STUDENT_CNIC = '4550476281307';

function daysFromNow(offset) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return d;
}

// dueOffset: days from today (negative = past). submission: null means
// no AssignmentSubmission gets created (the list endpoint reports
// 'not_submitted' for these on its own).
const WEB_DEV_ASSIGNMENTS = [
  {
    title: 'Portfolio Landing Page',
    description: 'Build a single-page personal portfolio using semantic HTML and hand-written CSS. No frameworks.',
    referenceLinks: ['https://docs.google.com/document/d/portfolio-landing-brief'],
    dueOffset: -30,
    isHackathon: false,
    submission: {
      status: 'approved',
      grade: '9/10',
      trainerRemarks: 'Great use of semantic HTML and clean layout. Well done!',
      submissionLink: 'https://github.com/ayesha-yousuf/portfolio-landing',
      submissionText: 'Deployed via GitHub Pages, mobile-responsive, Lighthouse score 96.',
    },
  },
  {
    title: 'JS Calculator App',
    description: 'Build a working calculator with vanilla JavaScript covering the four basic operations plus clear/backspace.',
    referenceLinks: ['https://github.com/saylani-titan/js-calculator-starter'],
    dueOffset: -25,
    isHackathon: false,
    submission: {
      status: 'late_submitted',
      submissionLink: 'https://github.com/ayesha-yousuf/js-calculator',
      submissionText: 'Submitted a day late due to a keyboard-input bug I wanted to fix first.',
    },
  },
  {
    title: 'Responsive Nav Challenge',
    description: 'Recreate the provided navbar design at mobile, tablet, and desktop breakpoints using Flexbox.',
    referenceLinks: ['https://www.figma.com/file/responsive-nav-challenge'],
    dueOffset: -20,
    isHackathon: false,
    submission: {
      status: 'submitted',
      submissionLink: 'https://github.com/ayesha-yousuf/responsive-nav',
      submissionText: 'Includes a hamburger menu for mobile with a slide-in drawer.',
    },
  },
  {
    title: 'CSS Grid Layout Practice',
    description: 'Rebuild the provided magazine-style layout mockup using CSS Grid only (no Flexbox).',
    referenceLinks: ['https://www.figma.com/file/css-grid-magazine-layout'],
    dueOffset: -18,
    isHackathon: false,
    submission: {
      status: 'approved',
      grade: '8/10',
      trainerRemarks: 'Good grid structure, minor spacing issues on the tablet breakpoint.',
      submissionLink: 'https://github.com/ayesha-yousuf/css-grid-magazine',
      submissionText: 'Used grid-template-areas for the main layout regions.',
    },
  },
  {
    title: 'Form Validation Exercise',
    description: 'Build a signup form with client-side validation (email format, password strength, required fields) — no libraries.',
    referenceLinks: ['https://docs.google.com/document/d/form-validation-brief'],
    dueOffset: -15,
    isHackathon: false,
    submission: {
      status: 'not_approved',
      grade: '5/10',
      trainerRemarks: 'Validation logic is incomplete — please review required-field handling and resubmit.',
      submissionLink: 'https://github.com/ayesha-yousuf/form-validation',
      submissionText: 'Email and password checks are done; still working on required-field messages.',
    },
  },
  {
    title: 'DOM Events Deep Dive',
    description: 'Build an interactive to-do list demonstrating event delegation, keyboard events, and drag-and-drop reordering.',
    referenceLinks: ['https://github.com/saylani-titan/dom-events-starter'],
    dueOffset: -12,
    isHackathon: false,
    submission: {
      status: 'approved',
      grade: '10/10',
      trainerRemarks: 'Excellent work — clean event delegation pattern and smooth drag-and-drop!',
      submissionLink: 'https://github.com/ayesha-yousuf/dom-events-todo',
      submissionText: 'Implemented drag-and-drop reordering with the native Drag and Drop API.',
    },
  },
  {
    title: 'Flexbox Card Gallery',
    description: 'Build a responsive image card gallery using Flexbox that reflows from 4 columns down to 1.',
    referenceLinks: ['https://www.figma.com/file/flexbox-card-gallery'],
    dueOffset: -10,
    isHackathon: false,
    submission: {
      status: 'late_submitted',
      submissionLink: 'https://github.com/ayesha-yousuf/flexbox-gallery',
      submissionText: 'Gallery reflows at 3 breakpoints, lazy-loads images.',
    },
  },
  {
    title: 'Git & GitHub Basics',
    description: 'Complete the branching/merging exercise repo: create branches, resolve a merge conflict, open a pull request.',
    referenceLinks: ['https://github.com/saylani-titan/git-basics-exercise'],
    dueOffset: -8,
    isHackathon: false,
    submission: {
      status: 'submitted',
      submissionLink: 'https://github.com/ayesha-yousuf/git-basics-exercise/pull/1',
      submissionText: 'PR includes the resolved merge conflict and a rebased feature branch.',
    },
  },
  {
    title: 'Weather API Hackathon',
    description: '48-hour hackathon: build a weather dashboard consuming a public API, with search, geolocation, and a 5-day forecast.',
    referenceLinks: ['https://docs.google.com/document/d/weather-hackathon-rules', 'https://openweathermap.org/api'],
    dueOffset: -5,
    isHackathon: true,
    submission: {
      status: 'approved',
      grade: '10/10',
      trainerRemarks: 'Outstanding hackathon submission — top of the batch! Certificate issued.',
      submissionLink: 'https://github.com/ayesha-yousuf/weather-hackathon',
      submissionText: 'Live demo deployed on Vercel, includes geolocation + 5-day forecast + dark mode.',
    },
  },
  {
    title: 'Local Storage Mini-Project',
    description: 'Build a notes app that persists entries to localStorage and survives a page refresh.',
    referenceLinks: ['https://github.com/saylani-titan/local-storage-notes-starter'],
    dueOffset: -3,
    isHackathon: false,
    submission: null, // overdue, never submitted
  },
  {
    title: 'React To-Do List',
    description: 'Rebuild the earlier vanilla-JS to-do list as a React app using useState and component composition.',
    referenceLinks: ['https://react.dev/learn'],
    dueOffset: 2,
    isHackathon: false,
    submission: null,
  },
  {
    title: 'API Weather Dashboard',
    description: 'Same brief as the hackathon version, but built solo over a full week with tests.',
    referenceLinks: ['https://openweathermap.org/api'],
    dueOffset: 5,
    isHackathon: false,
    submission: null,
  },
  {
    title: 'Accessibility Audit',
    description: 'Run an a11y audit on your portfolio site using axe DevTools and fix at least 5 flagged issues.',
    referenceLinks: ['https://www.deque.com/axe/devtools/'],
    dueOffset: 10,
    isHackathon: false,
    submission: null,
  },
  {
    title: 'Portfolio Deployment (Netlify/Vercel)',
    description: 'Deploy your portfolio site with a custom domain, HTTPS, and a CI-based deploy-on-push workflow.',
    referenceLinks: ['https://vercel.com/docs', 'https://docs.netlify.com/'],
    dueOffset: 20,
    isHackathon: false,
    submission: null,
  },
];

const AI_DS_ASSIGNMENTS = [
  {
    title: 'Python Basics Practice Set',
    description: 'Solve 20 short exercises covering variables, control flow, functions, and list/dict comprehensions.',
    referenceLinks: ['https://docs.google.com/document/d/python-basics-practice-set'],
    dueOffset: -35,
    isHackathon: false,
    submission: {
      status: 'approved',
      grade: '9/10',
      trainerRemarks: 'Clean, idiomatic solutions throughout. Nice use of comprehensions.',
      submissionLink: 'https://github.com/ayesha-yousuf/python-basics-practice',
      submissionText: 'All 20 exercises solved, added a few extra edge-case tests for myself.',
    },
  },
  {
    title: 'NumPy & Pandas Mini Project',
    description: 'Load a CSV dataset with Pandas, clean it, and compute summary statistics using NumPy and Pandas together.',
    referenceLinks: ['https://github.com/saylani-titan/numpy-pandas-starter'],
    dueOffset: -28,
    isHackathon: false,
    submission: {
      status: 'approved',
      grade: '8/10',
      trainerRemarks: 'Good cleaning pipeline — consider vectorizing the loop in step 3 next time.',
      submissionLink: 'https://github.com/ayesha-yousuf/numpy-pandas-mini-project',
      submissionText: 'Notebook includes missing-value handling, groupby aggregation, and summary stats.',
    },
  },
  {
    title: 'Exploratory Data Analysis on Titanic Dataset',
    description: 'Perform a full EDA on the Titanic dataset: distributions, correlations, and at least 5 visualizations with findings.',
    referenceLinks: ['https://www.kaggle.com/c/titanic/data'],
    dueOffset: -21,
    isHackathon: false,
    submission: {
      status: 'late_submitted',
      submissionLink: 'https://github.com/ayesha-yousuf/titanic-eda',
      submissionText: 'Submitted a day late — added extra Seaborn visualizations for survival by class and fare.',
    },
  },
  {
    title: 'Linear Regression from Scratch',
    description: 'Implement linear regression with gradient descent using only NumPy (no scikit-learn), and compare against sklearn.',
    referenceLinks: ['https://docs.google.com/document/d/linear-regression-from-scratch-brief'],
    dueOffset: -16,
    isHackathon: false,
    submission: {
      status: 'approved',
      grade: '10/10',
      trainerRemarks: 'Excellent — your from-scratch implementation matches sklearn within rounding error.',
      submissionLink: 'https://github.com/ayesha-yousuf/linear-regression-scratch',
      submissionText: 'Implemented batch gradient descent, plotted the cost curve, and validated against sklearn.',
    },
  },
  {
    title: 'Classification Model Comparison',
    description: 'Train and compare Logistic Regression, Decision Tree, and Random Forest on a shared dataset using proper metrics.',
    referenceLinks: ['https://scikit-learn.org/stable/supervised_learning.html'],
    dueOffset: -12,
    isHackathon: false,
    submission: {
      status: 'not_approved',
      grade: '5/10',
      trainerRemarks: "You're only reporting accuracy — please add precision/recall/F1 and a confusion matrix, then resubmit.",
      submissionLink: 'https://github.com/ayesha-yousuf/classification-comparison',
      submissionText: 'Compared three models on accuracy; still need to add the other metrics your feedback mentioned.',
    },
  },
  {
    title: 'Neural Network Digit Classifier',
    description: 'Build a simple feedforward neural network to classify handwritten digits (MNIST) using Keras/TensorFlow.',
    referenceLinks: ['https://www.tensorflow.org/datasets/catalog/mnist'],
    dueOffset: -7,
    isHackathon: false,
    submission: {
      status: 'submitted',
      submissionLink: 'https://github.com/ayesha-yousuf/mnist-digit-classifier',
      submissionText: 'Two hidden layers, ~97.8% test accuracy after 10 epochs.',
    },
  },
  {
    title: 'Kaggle Mini-Hackathon: Housing Price Prediction',
    description: '48-hour hackathon: build the best regression model you can for a housing-price dataset, submit to the class leaderboard.',
    referenceLinks: ['https://docs.google.com/document/d/housing-hackathon-rules', 'https://www.kaggle.com/c/house-prices-advanced-regression-techniques'],
    dueOffset: -4,
    isHackathon: true,
    submission: {
      status: 'approved',
      grade: '10/10',
      trainerRemarks: 'Top 3 on the class leaderboard — great feature engineering on lot size and neighborhood. Certificate issued.',
      submissionLink: 'https://github.com/ayesha-yousuf/housing-price-hackathon',
      submissionText: 'Gradient-boosted model with engineered features, ranked #2 on the class leaderboard.',
    },
  },
  {
    title: 'Data Cleaning Challenge',
    description: 'Clean a deliberately messy dataset (missing values, inconsistent formatting, duplicates, outliers) and document your steps.',
    referenceLinks: ['https://github.com/saylani-titan/messy-data-challenge'],
    dueOffset: -2,
    isHackathon: false,
    submission: null, // overdue, never submitted
  },
  {
    title: 'Model Deployment with Flask',
    description: 'Wrap a trained model in a simple Flask REST API with a /predict endpoint, and test it with sample requests.',
    referenceLinks: ['https://flask.palletsprojects.com/'],
    dueOffset: 4,
    isHackathon: false,
    submission: null,
  },
  {
    title: 'Capstone Project Proposal',
    description: 'Write a 1-2 page proposal for your capstone project: problem statement, dataset, planned approach, and success metrics.',
    referenceLinks: ['https://docs.google.com/document/d/capstone-proposal-template'],
    dueOffset: 15,
    isHackathon: false,
    submission: null,
  },
];

async function seedCourseAssignments(student, course, assignments) {
  const existingCount = await Assignment.countDocuments({ courseId: course._id });
  if (existingCount > 0) {
    console.log(`  ${course.name}: ${existingCount} assignments already exist. Skipping.`);
    return;
  }

  let submissionCount = 0;
  for (const item of assignments) {
    const assignment = await Assignment.create({
      title: item.title,
      description: item.description,
      referenceLinks: item.referenceLinks,
      dueDate: daysFromNow(item.dueOffset),
      isHackathon: item.isHackathon,
      courseId: course._id,
    });

    if (item.submission) {
      const submittedAt = daysFromNow(Math.min(item.dueOffset, 0) - 1);
      await AssignmentSubmission.create({
        student: student._id,
        assignment: assignment._id,
        submissionLink: item.submission.submissionLink,
        referenceImages: [],
        submissionText: item.submission.submissionText,
        status: item.submission.status,
        grade: item.submission.grade || '',
        trainerRemarks: item.submission.trainerRemarks || '',
        submittedAt,
        lastEditedAt: submittedAt,
      });
      submissionCount += 1;
    }
  }

  console.log(`  ${course.name}: seeded ${assignments.length} assignments (${submissionCount} with a submission).`);
}

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);

  const student = await Student.findOne({ cnic: STUDENT_CNIC });
  if (!student) {
    console.error(`No student found with CNIC ${STUDENT_CNIC}. Run "npm run seed" first.`);
    process.exit(1);
  }

  const webDev = await Course.findOne({ name: 'Web Development' });
  const aiDs = await Course.findOne({ name: 'AI & Data Science' });
  if (!webDev || !aiDs) {
    console.error('Courses not found. Run "npm run seed:courses" first.');
    process.exit(1);
  }

  console.log(`Seeding assignments for ${student.fullName}...`);
  await seedCourseAssignments(student, webDev, WEB_DEV_ASSIGNMENTS);
  await seedCourseAssignments(student, aiDs, AI_DS_ASSIGNMENTS);

  await mongoose.disconnect();
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err.message);
    process.exit(1);
  });
