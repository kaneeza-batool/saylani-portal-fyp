require('dotenv').config();

const mongoose = require('mongoose');
const Student = require('../models/Student');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');

// One course per student (see Student.js/Quiz.js) — no Course collection to
// seed against (it's empty in titan-portal; see attendanceController's
// equivalent fix). `course` is matched against the real Student.course
// string, and each course's quizzes only get created if at least one real
// student in titan-portal is actually taking that course.
const ATTEMPTER_CNIC = '4540110010122'; // Tariq Rehman — AI & Data Science

function mcq(questionText, options, correctOptionIndex, explanation) {
  return { questionText, options, correctOptionIndex, marks: 1, explanation };
}

const PYTHON_QUESTIONS = [
  mcq('What is the correct file extension for Python files?', ['.pyt', '.pt', '.py', '.pyth'], 2, 'Python source files use the .py extension, which the interpreter and tools like pip and IDEs recognize as executable Python code.'),
  mcq('Which keyword is used to define a function in Python?', ['function', 'def', 'func', 'define'], 1, 'The def keyword begins a function definition in Python, e.g. def greet(): ...'),
  mcq('What is the output of print(2 ** 3)?', ['6', '8', '9', '16'], 1, 'The ** operator raises the left operand to the power of the right, so 2 ** 3 = 2×2×2 = 8.'),
  mcq('Which data type is immutable in Python?', ['list', 'dict', 'set', 'tuple'], 3, "Tuples are immutable — once created, their contents can't be changed — unlike lists, dicts, and sets, which are all mutable."),
  mcq('What does the len() function do?', ['Returns the largest item', 'Returns the length of an object', 'Returns the type of an object', 'Returns the last item'], 1, 'len() returns the number of items in a sequence or collection, such as the length of a string or list.'),
  mcq('Which of the following is used to comment a single line in Python?', ['//', '#', '/* */', '--'], 1, 'A hash symbol (#) starts a single-line comment in Python — everything after it on that line is ignored by the interpreter.'),
  mcq('What is the result of 10 % 3?', ['0', '1', '3', '3.33'], 1, 'The % operator returns the remainder of division: 10 divided by 3 is 3 remainder 1.'),
  mcq('Which method adds an item to the end of a list?', ['add()', 'append()', 'insert()', 'extend()'], 1, 'list.append(x) adds a single item to the end of a list in place.'),
  mcq('What does range(5) produce?', ['1,2,3,4,5', '0,1,2,3,4', '0,1,2,3,4,5', '1,2,3,4'], 1, 'range(5) generates 0, 1, 2, 3, 4 — five values starting at 0 and stopping before 5.'),
  mcq('Which keyword is used for exception handling in Python?', ['catch', 'except', 'handle', 'rescue'], 1, 'The except block catches and handles exceptions raised inside a try block.'),
  mcq('What is the correct way to create a dictionary in Python?', ['dict = []', 'dict = ()', 'dict = {}', 'dict = <>'], 2, 'Curly braces {} create an empty dictionary in Python (an empty set requires set()).'),
  mcq('Which operator is used for exponentiation?', ['^', '**', '%%', 'exp()'], 1, 'The ** operator performs exponentiation, e.g. 2 ** 3 equals 8. (^ is bitwise XOR in Python, not exponent.)'),
  mcq('What is the output of bool(0)?', ['True', 'False', '0', 'Error'], 1, '0 is falsy in Python, so bool(0) evaluates to False; any nonzero number is truthy.'),
  mcq('Which of these is NOT a valid variable name?', ['_value', 'value1', '1value', 'Value'], 2, "Python variable names can't start with a digit — 1value is a syntax error."),
  mcq('What does the type() function return?', ['The value of a variable', 'The memory address', 'The data type of an object', 'The length of an object'], 2, "type() returns the data type (class) of the object passed to it, e.g. type(5) is <class 'int'>."),
  mcq('Which keyword is used to exit a loop prematurely?', ['stop', 'exit', 'break', 'return'], 2, 'break immediately exits the nearest enclosing loop, skipping any remaining iterations.'),
  mcq('What is the output of "Hello" + "World"?', ['Hello World', 'HelloWorld', 'Hello+World', 'Error'], 1, "The + operator concatenates strings directly with no added space, producing 'HelloWorld'."),
  mcq('Which function converts a string to an integer?', ['str()', 'int()', 'float()', 'num()'], 1, "int() converts a compatible string or number into an integer, e.g. int('42') returns 42."),
  mcq('What does list[-1] return?', ['The first item', 'The last item', 'An error', 'None'], 1, 'Negative indices count from the end of a sequence, so -1 refers to the last element.'),
  mcq('Which of these creates a set in Python?', ['{1, 2, 3}', '[1, 2, 3]', '(1, 2, 3)', '<1, 2, 3>'], 0, 'Curly braces with comma-separated values (no colons) create a set; {} alone creates an empty dict, not a set.'),
  mcq('What is the purpose of the self keyword in a class method?', ['Refers to the class itself', 'Refers to the instance of the class', 'A reserved keyword with no use', 'Refers to the parent class'], 1, 'self is the conventional first parameter of instance methods, referring to the specific object the method was called on.'),
  mcq('Which module is used to work with regular expressions?', ['regex', 're', 'regexp', 'pyregex'], 1, "The built-in re module provides functions for working with regular expressions in Python."),
  mcq('What is the output of print(3 == 3.0)?', ['True', 'False', 'Error', 'None'], 0, 'Python compares values, not types, with ==, so an int and an equal float compare as True.'),
  mcq('Which method removes and returns the last item of a list?', ['remove()', 'pop()', 'delete()', 'discard()'], 1, 'list.pop() removes and returns the last item by default (or an item at a given index).'),
  mcq('What is a lambda function?', ['A named function', 'An anonymous inline function', 'A class method', 'A built-in module'], 1, 'A lambda is a small anonymous function defined inline with the lambda keyword, e.g. lambda x: x + 1.'),
  mcq("Which of these is used to open a file for reading in Python?", ["open('file.txt', 'w')", "open('file.txt', 'r')", "open('file.txt', 'a')", "open('file.txt', 'x')"], 1, "The 'r' mode opens a file for reading, which is also the default mode if none is specified."),
  mcq('What does import do in Python?', ['Deletes a module', 'Loads a module into the current namespace', 'Compiles a module', 'Runs a module as main'], 1, "import brings a module's names into the current namespace so its functions and classes can be used."),
  mcq('Which of these is a valid list comprehension?', ['[x for x in range(5)]', '(x for x in range(5))[]', '{x in range(5)}', 'list x in range(5)'], 0, 'Square brackets with a for clause form a list comprehension, producing a new list.'),
  mcq("What is the output of print(type([]))?", ["<class 'list'>", "<class 'array'>", "<class 'tuple'>", "<class 'set'>"], 0, "An empty list literal [] is an instance of Python's built-in list class."),
  mcq('Which keyword defines a class in Python?', ['class', 'Class', 'define', 'struct'], 0, 'The class keyword begins a class definition, e.g. class Dog: ...'),
  mcq('What is the result of 5 // 2?', ['2.5', '2', '3', '1'], 1, '// is floor (integer) division — it divides and rounds down to the nearest whole number, discarding the remainder.'),
  mcq('Which method converts a string to lowercase?', ['lower()', 'toLower()', 'lowercase()', 'downcase()'], 0, 'str.lower() returns a copy of the string with all characters converted to lowercase.'),
  mcq("What is the output of print('abc'[1])?", ['a', 'b', 'c', 'Error'], 1, "String indexing is zero-based, so index 1 refers to the second character, 'b'."),
  mcq('Which built-in function returns the largest item in an iterable?', ['max()', 'largest()', 'top()', 'big()'], 0, 'max() returns the largest item in an iterable or the largest of the given arguments.'),
  mcq('What does pass do in Python?', ['Skips the rest of the loop', 'Does nothing, acts as a placeholder', 'Exits the function', 'Raises an exception'], 1, 'pass is a null operation — it does nothing and is used as a placeholder where syntax requires a statement.'),
  mcq('Which operator checks object identity (same memory location) rather than equality?', ['==', 'is', 'in', 'not'], 1, 'The is operator checks whether two references point to the exact same object in memory, unlike == which checks value equality.'),
  mcq('What is the correct syntax to create a function with a default argument?', ['def f(x=5):', 'def f(x:=5):', 'def f(x==5):', 'def f(x-5):'], 0, 'Default argument values are set with = inside the parentheses of a function definition.'),
  mcq("Which of these data structures maintains insertion order in Python 3.7+?", ['set', 'dict', 'frozenset', 'None of these'], 1, 'Since Python 3.7, standard dicts guarantee insertion order is preserved when iterating.'),
  mcq('What does the try/finally block guarantee?', ['The finally block always runs, even if an exception occurs', 'The finally block only runs if no exception occurs', 'The try block is skipped', 'Nothing is guaranteed'], 0, 'Code inside a finally block always executes after the try (and any except) block, whether or not an exception occurred.'),
  mcq('Which function returns an iterator of index-value pairs?', ['zip()', 'enumerate()', 'index()', 'pair()'], 1, 'enumerate() wraps an iterable and yields (index, value) pairs, useful for looping with a counter.'),
  mcq('What is the output of print(10 != 10)?', ['True', 'False', 'Error', 'None'], 1, '!= tests inequality; since 10 does equal 10, the comparison evaluates to False.'),
  mcq('Which of these is used to define a tuple with a single element?', ['(5)', '(5,)', '[5]', '{5}'], 1, 'A trailing comma is required to create a single-element tuple — (5) without a comma is just the integer 5 in parentheses.'),
  mcq('What does the with statement help manage?', ['Loops', 'Resource/context management (e.g. file handles)', 'Class inheritance', 'Exception types'], 1, 'The with statement wraps a block in a context manager, automatically handling setup and cleanup (like closing a file) even if an error occurs.'),
  mcq("Which of these correctly checks if a key exists in a dictionary?", ["'key' in dict", "dict.hasKey('key')", "dict.contains('key')", "key.exists(dict)"], 0, "The in operator checks for key membership in a dictionary directly, e.g. 'key' in my_dict."),
  mcq('What is the output of print(bool([]))?', ['True', 'False', 'Error', '[]'], 1, 'An empty list is falsy in Python — bool() of any empty collection returns False.'),
  mcq('Which keyword is used to import only a specific function from a module?', ['import only', 'from module import function', 'include module.function', 'use module.function'], 1, 'The from ... import ... syntax imports a specific name directly from a module, rather than the whole module.'),
  mcq('What does *args allow a function to accept?', ['A fixed number of arguments', 'A variable number of positional arguments', 'Only keyword arguments', 'No arguments'], 1, '*args collects any number of extra positional arguments into a tuple inside the function.'),
  mcq("Which method joins a list of strings into a single string?", ["','.join(list)", "list.join(',')", "join(list, ',')", 'concat(list)'], 0, "str.join(iterable) joins the iterable's string elements together, separated by the string it's called on."),
  mcq('What is the output of print(round(4.5))?', ['4', '5', '4.5', 'Error'], 0, "Python 3's round() uses banker's rounding (round-half-to-even), so 4.5 rounds down to 4, not up to 5."),
  mcq('Which of these best describes Python?', ['A compiled, statically-typed language', 'An interpreted, dynamically-typed language', 'A markup language', 'A database query language'], 1, 'Python code is executed by an interpreter (not compiled ahead of time to machine code), and variable types are determined at runtime rather than declared.'),
];

const NUMPY_PANDAS_QUESTIONS = [
  mcq('What is the primary data structure in NumPy for storing homogeneous numerical data?', ['DataFrame', 'ndarray', 'Series', 'Matrix'], 1, "NumPy's core object is the ndarray (n-dimensional array) — a fixed-size, homogeneously-typed grid of values."),
  mcq('Which Pandas object represents a single labeled column of data?', ['DataFrame', 'Series', 'Index', 'Panel'], 1, 'A Pandas Series is a one-dimensional labeled array; a DataFrame is a collection of Series sharing an index.'),
  mcq('What does df.head() return by default?', ['The last 5 rows', 'The first 5 rows', 'All rows', 'A single column'], 1, 'DataFrame.head() returns the first 5 rows by default, useful for quickly inspecting a dataset.'),
  mcq('Which NumPy function creates an array of evenly spaced values within a given range?', ['np.linspace()', 'np.arange()', 'np.zeros()', 'np.eye()'], 1, 'np.arange(start, stop, step) generates evenly spaced values based on a step size, similar to the built-in range().'),
  mcq('How do you select rows by label in a Pandas DataFrame?', ['.iloc[]', '.loc[]', '.at[]', '.get[]'], 1, '.loc[] selects rows and columns by label; .iloc[] selects by integer position instead.'),
  mcq('What does df.isnull().sum() typically report?', ['The total row count', 'The count of missing values per column', 'The data types of each column', 'The sum of all numeric columns'], 1, 'isnull() flags missing values as True/False, and summing that per column counts how many are missing in each.'),
  mcq('Which NumPy array attribute returns its dimensions?', ['.size', '.shape', '.dtype', '.ndim'], 1, '.shape returns a tuple giving the size of the array along each dimension, e.g. (3, 4) for a 3x4 matrix.'),
  mcq('What is "broadcasting" in NumPy?', ['Sending data over a network', 'Automatically expanding smaller arrays to match shape for element-wise operations', 'Converting arrays to lists', 'Printing an array to the console'], 1, 'Broadcasting lets NumPy perform element-wise operations on arrays of different but compatible shapes without explicit loops or copies.'),
];

const ML_FUNDAMENTALS_QUESTIONS = [
  mcq('What is overfitting in machine learning?', ['A model that trains too slowly', 'A model that fits training data too closely and generalizes poorly to new data', 'A model with too few parameters', 'A model that never converges'], 1, 'Overfitting happens when a model memorizes noise/details in the training set rather than learning generalizable patterns, hurting performance on unseen data.'),
  mcq('Which metric is most appropriate for a highly imbalanced classification problem, alongside or instead of accuracy?', ['Mean squared error', 'F1 score', 'R-squared', 'Silhouette score'], 1, 'F1 score balances precision and recall, which matters far more than raw accuracy when one class vastly outnumbers the other.'),
  mcq('What does supervised learning require?', ['Only unlabeled data', 'Labeled training data with known outputs', 'No training data at all', 'A reward signal from an environment'], 1, 'Supervised learning trains a model on input-output pairs where the correct answer (label) is already known.'),
  mcq('Why do we split data into training and test sets?', ['To make training faster', 'To evaluate how the model performs on data it has not seen', 'To reduce the file size of the dataset', 'It is only needed for deep learning'], 1, 'A held-out test set estimates how well a model generalizes to new data, rather than just how well it memorized the training set.'),
  mcq('Which algorithm builds a series of if/else splits to reach a classification decision?', ['K-means', 'Decision Tree', 'Linear Regression', 'Principal Component Analysis'], 1, 'A Decision Tree recursively splits data on feature thresholds, forming a tree of if/else decisions ending in a predicted class.'),
  mcq('What does feature scaling (e.g. standardization) primarily help with?', ['Deleting missing values', 'Gradient descent convergence and distance-based algorithms', 'Increasing dataset size', 'Removing duplicate rows'], 1, 'Scaling features to a similar range helps gradient-based optimizers converge faster and prevents distance-based algorithms (like KNN) from being dominated by large-magnitude features.'),
  mcq('What is cross-validation used for?', ['Encrypting a dataset', 'Getting a more reliable estimate of model performance across multiple splits', 'Speeding up data cleaning', 'Visualizing high-dimensional data'], 1, 'Cross-validation repeatedly trains and evaluates on different train/test splits, averaging results for a more robust performance estimate than a single split.'),
  mcq('Which of these is an unsupervised learning technique?', ['K-means clustering', 'Logistic Regression', 'Random Forest classification', 'Support Vector Machine classification'], 0, 'K-means groups data into clusters based purely on feature similarity, with no labeled outputs — unsupervised learning.'),
];

const HTML_CSS_QUESTIONS = [
  mcq('What does HTML stand for?', ['Hyper Trainer Marking Language', 'Hyper Text Markup Language', 'Hyper Text Making Language', 'Hyperlink Text Markup Language'], 1, 'HTML stands for Hyper Text Markup Language, the standard markup language for building web pages.'),
  mcq('Which HTML tag is used to define an internal style sheet?', ['<css>', '<script>', '<style>', '<link>'], 2, "The <style> tag defines internal CSS rules directly inside an HTML document's <head>."),
  mcq('Which CSS property controls the text size?', ['font-style', 'text-size', 'font-size', 'text-style'], 2, 'The font-size CSS property controls how large text is rendered.'),
  mcq('Which HTML element is used to specify a footer for a document?', ['<bottom>', '<footer>', '<section>', '<foot>'], 1, 'The <footer> element semantically represents the footer section of a document or a section.'),
  mcq('How do you select an element with id "header" in CSS?', ['.header', '#header', '*header', 'header'], 1, 'A hash (#) prefix selects an element by its id attribute in CSS, e.g. #header targets id="header".'),
  mcq('Which property is used to change the background color in CSS?', ['color', 'bgcolor', 'background-color', 'background'], 2, 'background-color sets the background fill color of an element.'),
  mcq('What is the default value of the position property in CSS?', ['relative', 'fixed', 'static', 'absolute'], 2, 'static is the default position value — elements render in normal document flow, and offsets like top/left have no effect.'),
  mcq('Which HTML attribute specifies an alternate text for an image?', ['title', 'alt', 'src', 'longdesc'], 1, 'The alt attribute provides alternate text for an image, shown if the image fails to load and used by screen readers.'),
  mcq('Which CSS layout module is designed for one-dimensional layouts?', ['Grid', 'Flexbox', 'Float', 'Table'], 1, 'Flexbox is designed for laying out items along a single axis (row or column); Grid handles two-dimensional layouts.'),
  mcq('Which HTML5 element is used to draw graphics via JavaScript?', ['<svg>', '<canvas>', '<draw>', '<graphic>'], 1, 'The <canvas> element provides a drawable surface that JavaScript can use to render graphics, shapes, and animations.'),
];

// course -> [{ module, title, questions, durationMinutes, attempt }]. attempt
// is only ever set for the ATTEMPTER_CNIC student — everything else stays
// unattempted so the list endpoint reports it as such on its own.
const COURSE_QUIZZES = {
  'AI & Data Science': [
    {
      module: 'Python Foundations',
      title: 'Python Quiz',
      questions: PYTHON_QUESTIONS,
      durationMinutes: 45,
      // Recreates the original seed's real-screenshot scenario: 34/50
      // correct (68%) — deliberately wrong on the back 16 questions.
      attempt: { correctThrough: 34 },
    },
    {
      module: 'Data Handling',
      title: 'NumPy & Pandas Basics',
      questions: NUMPY_PANDAS_QUESTIONS,
      durationMinutes: 15,
      attempt: null, // unattempted
    },
    {
      module: 'Machine Learning',
      title: 'Machine Learning Fundamentals',
      questions: ML_FUNDAMENTALS_QUESTIONS,
      durationMinutes: 15,
      attempt: null, // unattempted
    },
  ],
  'Web Development': [
    {
      module: 'HTML & CSS Foundations',
      title: 'HTML & CSS Quiz',
      questions: HTML_CSS_QUESTIONS,
      durationMinutes: 15,
      attempt: null, // exists purely to prove the per-course filter doesn't leak
    },
  ],
};

async function seedCourseQuizzes(course, quizzes, attempter) {
  const hasRealStudents = await Student.exists({ course });
  if (!hasRealStudents) {
    console.log(`  ${course}: no real students in titan-portal — skipping.`);
    return;
  }

  const existingCount = await Quiz.countDocuments({ course });
  if (existingCount > 0) {
    console.log(`  ${course}: ${existingCount} quizzes already exist. Skipping.`);
    return;
  }

  let attemptCount = 0;
  for (const item of quizzes) {
    const quiz = await Quiz.create({
      course,
      module: item.module,
      title: item.title,
      questions: item.questions,
      durationMinutes: item.durationMinutes,
    });

    if (item.attempt && attempter) {
      const { correctThrough } = item.attempt;
      const answers = item.questions.map((q, i) => (i < correctThrough ? q.correctOptionIndex : (q.correctOptionIndex + 1) % 4));
      const score = answers.filter((a, i) => a === item.questions[i].correctOptionIndex).length;
      const totalMarks = item.questions.reduce((sum, q) => sum + q.marks, 0);
      const percentage = Math.round((score / totalMarks) * 100);
      const startedAt = new Date();
      startedAt.setDate(startedAt.getDate() - 6);
      const submittedAt = new Date(startedAt.getTime() + 38 * 60 * 1000);

      await QuizAttempt.create({
        student: attempter._id,
        quiz: quiz._id,
        answers,
        score,
        percentage,
        status: percentage >= QuizAttempt.PASS_THRESHOLD_PERCENT ? 'passed' : 'failed',
        tabSwitchCount: 0,
        fullscreenExitCount: 0,
        startedAt,
        submittedAt,
        attemptNumber: 1,
      });
      attemptCount += 1;
    }
  }

  console.log(`  ${course}: seeded ${quizzes.length} quizzes (${attemptCount} with an attempt).`);
}

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);

  const attempter = await Student.findOne({ cnic: ATTEMPTER_CNIC });
  if (!attempter) {
    console.error(`No student found with CNIC ${ATTEMPTER_CNIC} — attempts will be skipped for their course.`);
  }

  console.log('Seeding quizzes (scoped by real Student.course values in titan-portal)...');
  for (const [course, quizzes] of Object.entries(COURSE_QUIZZES)) {
    const attempter_ = course === attempter?.course ? attempter : null;
    await seedCourseQuizzes(course, quizzes, attempter_);
  }

  await mongoose.disconnect();
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err.message);
    process.exit(1);
  });
