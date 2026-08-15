require('dotenv').config();

const mongoose = require('mongoose');
const Student = require('../models/Student');
const Course = require('../models/Course');
const CourseModule = require('../models/CourseModule');

const STUDENT_CNIC = '4550476281307';

function topic(topicName, isCompleted) {
  return { topicName, isCompleted };
}

// order, moduleName, topics — completed/total counts match the real
// screenshot exactly (see each module's comment).
const AI_DS_MODULES = [
  {
    order: 1,
    moduleName: 'Python Foundations', // 11/11, 100%
    topics: [
      topic('Variables & Data Types', true),
      topic('Operators & Expressions', true),
      topic('Control Flow (if/else)', true),
      topic('Loops (for & while)', true),
      topic('Functions & Scope', true),
      topic('Lists & Tuples', true),
      topic('Dictionaries & Sets', true),
      topic('String Manipulation', true),
      topic('File Handling', true),
      topic('Exception Handling', true),
      topic('Object-Oriented Programming Basics', true),
    ],
  },
  {
    order: 2,
    moduleName: 'Python for Data Science', // 8/8, 100%
    topics: [
      topic('NumPy Arrays & Operations', true),
      topic('Pandas Series & DataFrames', true),
      topic('Data Cleaning & Preprocessing', true),
      topic('Data Aggregation & Grouping', true),
      topic('Merging & Joining Datasets', true),
      topic('Data Visualization with Matplotlib', true),
      topic('Data Visualization with Seaborn', true),
      topic('Exploratory Data Analysis (EDA)', true),
    ],
  },
  {
    order: 3,
    moduleName: 'Statistics & Math for ML', // 8/8, 100%
    topics: [
      topic('Descriptive Statistics', true),
      topic('Probability Fundamentals', true),
      topic('Probability Distributions', true),
      topic('Linear Algebra Basics', true),
      topic('Calculus for ML (Derivatives & Gradients)', true),
      topic('Hypothesis Testing', true),
      topic('Correlation & Covariance', true),
      topic('Bayesian Statistics Basics', true),
    ],
  },
  {
    order: 4,
    moduleName: 'Machine Learning', // 8/8, 100%
    topics: [
      topic('Supervised vs Unsupervised Learning', true),
      topic('Linear Regression', true),
      topic('Logistic Regression', true),
      topic('Decision Trees & Random Forests', true),
      topic('Support Vector Machines', true),
      topic('Clustering (K-Means)', true),
      topic('Model Evaluation Metrics', true),
      topic('Cross-Validation & Hyperparameter Tuning', true),
    ],
  },
  {
    order: 5,
    moduleName: 'Deep Learning', // 5/5, 100%
    topics: [
      topic('Neural Network Fundamentals', true),
      topic('Activation Functions', true),
      topic('Backpropagation & Gradient Descent', true),
      topic('Convolutional Neural Networks (CNNs)', true),
      topic('Recurrent Neural Networks (RNNs)', true),
    ],
  },
  {
    order: 6,
    moduleName: 'MLOps', // 2/8, 25%
    topics: [
      topic('Version Control for ML Projects', true),
      topic('Environment & Dependency Management', true),
      topic('Model Packaging & Containerization (Docker)', false),
      topic('CI/CD for Machine Learning', false),
      topic('Model Serving & REST APIs', false),
      topic('Experiment Tracking (MLflow)', false),
      topic('Model Monitoring & Drift Detection', false),
      topic('Cloud Deployment Pipelines', false),
    ],
  },
  {
    order: 7,
    moduleName: 'Big Data & Cloud', // 0/5, 0%
    topics: [
      topic('Introduction to Big Data (Hadoop Ecosystem)', false),
      topic('Apache Spark Fundamentals', false),
      topic('Cloud Storage & Compute (AWS/GCP/Azure)', false),
      topic('Distributed Data Processing', false),
      topic('Cloud-based ML Pipelines', false),
    ],
  },
  {
    order: 8,
    moduleName: 'GENERATIVE AI/LLMs', // 4/9, 44%
    topics: [
      topic('Introduction to Generative AI', true),
      topic('Transformer Architecture', true),
      topic('Prompt Engineering Fundamentals', true),
      topic('Working with LLM APIs (OpenAI, etc.)', true),
      topic('Fine-Tuning Large Language Models', false),
      topic('Retrieval-Augmented Generation (RAG)', false),
      topic('Vector Databases & Embeddings', false),
      topic('LLM Evaluation & Guardrails', false),
      topic('Building AI-Powered Applications', false),
    ],
  },
  {
    order: 9,
    moduleName: 'Agentic AI', // 0/9, 0%
    topics: [
      topic('Introduction to AI Agents', false),
      topic('Agent Planning & Reasoning', false),
      topic('Tool Use & Function Calling', false),
      topic('Multi-Agent Systems', false),
      topic('Memory & Context Management', false),
      topic('Agent Orchestration Frameworks', false),
      topic('Autonomous Task Execution', false),
      topic('Agent Safety & Guardrails', false),
      topic('Building a Custom AI Agent', false),
    ],
  },
];

// Web Development's module list — a smaller, earlier-stage curriculum than
// AI & Data Science's, and deliberately NOT the same numbers, per course.
const WEB_DEV_MODULES = [
  {
    order: 1,
    moduleName: 'HTML & CSS Foundations', // 10/10, 100%
    topics: [
      topic('Semantic HTML Structure', true),
      topic('CSS Selectors & Specificity', true),
      topic('The Box Model', true),
      topic('Typography & Web Fonts', true),
      topic('Colors, Units & CSS Variables', true),
      topic('Forms & Form Validation', true),
      topic('Flexbox Layout', true),
      topic('CSS Grid Layout', true),
      topic('Responsive Media Queries', true),
      topic('CSS Transitions & Animations', true),
    ],
  },
  {
    order: 2,
    moduleName: 'JavaScript Foundations', // 10/10, 100%
    topics: [
      topic('Variables, Types & Operators', true),
      topic('Control Flow & Loops', true),
      topic('Functions & Scope', true),
      topic('Arrays & Array Methods', true),
      topic('Objects & Destructuring', true),
      topic('The DOM & Event Handling', true),
      topic('Closures & Higher-Order Functions', true),
      topic('Asynchronous JS (Promises, async/await)', true),
      topic('Fetch API & Working with JSON', true),
      topic('ES Modules', true),
    ],
  },
  {
    order: 3,
    moduleName: 'Responsive Design (Flexbox & Grid)', // 6/6, 100%
    topics: [
      topic('Mobile-First Design Principles', true),
      topic('Breakpoint Strategy', true),
      topic('Flexbox in Practice', true),
      topic('Grid in Practice', true),
      topic('Responsive Images', true),
      topic('Cross-Browser Testing', true),
    ],
  },
  {
    order: 4,
    moduleName: 'React Fundamentals', // 5/8, 63%
    topics: [
      topic('Components & JSX', true),
      topic('Props & State', true),
      topic('Event Handling in React', true),
      topic('Conditional & List Rendering', true),
      topic('useEffect & Side Effects', true),
      topic('React Router Basics', false),
      topic('Forms & Controlled Inputs', false),
      topic('Context API', false),
    ],
  },
  {
    order: 5,
    moduleName: 'Backend Basics (Node & Express)', // 0/7, 0%
    topics: [
      topic('Node.js Fundamentals', false),
      topic('Express Routing & Middleware', false),
      topic('REST API Design', false),
      topic('Connecting to MongoDB', false),
      topic('Authentication Basics (JWT)', false),
      topic('Error Handling & Validation', false),
      topic('Testing APIs with Postman', false),
    ],
  },
  {
    order: 6,
    moduleName: 'Deployment & DevOps Basics', // 0/5, 0%
    topics: [
      topic('Git & GitHub Workflow', false),
      topic('Environment Variables & Config', false),
      topic('Deploying to Vercel/Netlify', false),
      topic('Deploying a Node API (Render/Railway)', false),
      topic('CI Basics with GitHub Actions', false),
    ],
  },
];

async function seedCourseModules(student, course, modules) {
  const existingCount = await CourseModule.countDocuments({ student: student._id, courseId: course._id });
  if (existingCount > 0) {
    console.log(`  ${course.name}: ${existingCount} course modules already exist. Skipping.`);
    return;
  }

  for (const mod of modules) {
    await CourseModule.create({
      student: student._id,
      courseId: course._id,
      moduleName: mod.moduleName,
      order: mod.order,
      topics: mod.topics,
    });
  }

  const totalTopics = modules.reduce((sum, m) => sum + m.topics.length, 0);
  const completedTopics = modules.reduce((sum, m) => sum + m.topics.filter((t) => t.isCompleted).length, 0);

  console.log(
    `  ${course.name}: seeded ${modules.length} modules — ${completedTopics}/${totalTopics} topics (${Math.round(
      (completedTopics / totalTopics) * 100
    )}%).`
  );
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

  console.log(`Seeding progress for ${student.fullName}...`);
  await seedCourseModules(student, webDev, WEB_DEV_MODULES);
  await seedCourseModules(student, aiDs, AI_DS_MODULES);

  await mongoose.disconnect();
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err.message);
    process.exit(1);
  });
