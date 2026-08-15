require('dotenv').config();

const mongoose = require('mongoose');
const Student = require('../models/Student');
const Assignment = require('../models/Assignment');
const AssignmentSubmission = require('../models/AssignmentSubmission');

// One course per student now (see Student.js/Assignment.js) — no Course
// collection to seed against (it's empty in titan-portal; see
// attendanceController's equivalent fix). `course` is matched against the
// real Student.course string, and each course's assignments only get
// created if at least one real student in titan-portal is actually taking
// that course.
//
// Submissions are only attached to one real, login-capable student per
// course (Tariq Rehman for AI & Data Science) so the "raw API as a real
// student" check has something to see — the other seeded course
// (UI/UX Design) is deliberately submission-free, existing only to prove
// the per-course filter doesn't leak assignments across courses.
const SUBMITTER_CNIC = '4540110010122'; // Tariq Rehman — AI & Data Science

function daysFromNow(offset) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return d;
}

// dueOffset: days from today (negative = past). submission: null means no
// AssignmentSubmission gets created (the list endpoint reports
// 'not_submitted' for these on its own — that's how "pending"/"overdue" work).
const COURSE_ASSIGNMENTS = {
  'AI & Data Science': [
    {
      title: 'Exploratory Data Analysis on Student Enrollment Trends',
      description:
        'Perform a full EDA on the campus enrollment dataset: distributions by course, attendance correlation, and at least 4 visualizations with written findings.',
      referenceLinks: ['https://pandas.pydata.org/docs/user_guide/index.html'],
      dueOffset: -20,
      isHackathon: false,
      submission: {
        status: 'approved',
        grade: '9/10',
        trainerRemarks: 'Thorough EDA — the attendance-vs-completion correlation chart was a nice touch.',
        submissionLink: 'https://github.com/tariq-rehman/enrollment-eda',
        submissionText: 'Notebook covers missing-value handling, groupby aggregation by course, and 5 Seaborn plots.',
      },
    },
    {
      title: 'Linear Regression from Scratch',
      description:
        'Implement linear regression with gradient descent using only NumPy (no scikit-learn), and compare your results against sklearn on the same dataset.',
      referenceLinks: ['https://numpy.org/doc/stable/'],
      dueOffset: -10,
      isHackathon: false,
      submission: {
        status: 'submitted',
        submissionLink: 'https://github.com/tariq-rehman/linear-regression-scratch',
        submissionText: 'Batch gradient descent implementation, cost curve plotted, matches sklearn within rounding error.',
      },
    },
    {
      title: 'Neural Network Digit Classifier (MNIST)',
      description:
        'Build a simple feedforward neural network to classify handwritten digits from the MNIST dataset using Keras/TensorFlow.',
      referenceLinks: ['https://www.tensorflow.org/datasets/catalog/mnist'],
      dueOffset: -3,
      isHackathon: false,
      submission: null, // overdue, never submitted
    },
    {
      title: 'Capstone Project Proposal',
      description:
        'Write a 1-2 page proposal for your capstone project: problem statement, dataset, planned approach, and success metrics.',
      referenceLinks: ['https://docs.google.com/document/d/capstone-proposal-template'],
      dueOffset: 10,
      isHackathon: false,
      submission: null, // pending, not yet due
    },
  ],
  'UI/UX Design': [
    {
      title: 'Mobile App Wireframe Critique',
      description:
        'Pick 2 published mobile apps in the same category and produce a heuristic-evaluation writeup covering navigation, hierarchy, and accessibility.',
      referenceLinks: ['https://www.nngroup.com/articles/ten-usability-heuristics/'],
      dueOffset: 6,
      isHackathon: false,
      submission: null,
    },
    {
      title: 'Design System Component Library',
      description:
        'Build a reusable Figma component library (buttons, inputs, cards, modals) with documented variants and states.',
      referenceLinks: ['https://www.figma.com/best-practices/components-styles-and-shared-libraries/'],
      dueOffset: 14,
      isHackathon: false,
      submission: null,
    },
  ],
};

async function seedCourseAssignments(course, assignments, submitter) {
  const hasRealStudents = await Student.exists({ course });
  if (!hasRealStudents) {
    console.log(`  ${course}: no real students in titan-portal — skipping.`);
    return;
  }

  const existingCount = await Assignment.countDocuments({ course });
  if (existingCount > 0) {
    console.log(`  ${course}: ${existingCount} assignments already exist. Skipping.`);
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
      course,
    });

    if (item.submission && submitter) {
      const submittedAt = daysFromNow(Math.min(item.dueOffset, 0) - 1);
      await AssignmentSubmission.create({
        student: submitter._id,
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

  console.log(`  ${course}: seeded ${assignments.length} assignments (${submissionCount} with a submission).`);
}

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);

  const submitter = await Student.findOne({ cnic: SUBMITTER_CNIC });
  if (!submitter) {
    console.error(`No student found with CNIC ${SUBMITTER_CNIC} — submissions will be skipped for their course.`);
  }

  console.log('Seeding assignments (scoped by real Student.course values in titan-portal)...');
  for (const [course, assignments] of Object.entries(COURSE_ASSIGNMENTS)) {
    const submitter_ = course === submitter?.course ? submitter : null;
    await seedCourseAssignments(course, assignments, submitter_);
  }

  await mongoose.disconnect();
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err.message);
    process.exit(1);
  });
