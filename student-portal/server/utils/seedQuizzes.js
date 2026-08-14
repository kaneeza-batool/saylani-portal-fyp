require('dotenv').config();

const mongoose = require('mongoose');
const Student = require('../models/Student');
const Course = require('../models/Course');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');

const STUDENT_CNIC = '4550476281307';

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

const JS_QUESTIONS = [
  mcq('Which keyword declares a block-scoped variable in JavaScript?', ['var', 'let', 'global', 'static'], 1, 'let declares a variable scoped to the nearest enclosing block ({}), unlike var which is function-scoped.'),
  mcq('What does === check in JavaScript?', ['Value equality only', 'Value and type equality', 'Type equality only', 'Reference equality for objects only'], 1, "=== is JavaScript's strict equality operator — it compares both value and type, without the type coercion that == performs."),
  mcq('Which method converts a JSON string into a JavaScript object?', ['JSON.stringify()', 'JSON.parse()', 'JSON.object()', 'JSON.toObject()'], 1, 'JSON.parse() converts a JSON-formatted string into a native JavaScript value (object, array, etc.).'),
  mcq('What is the output of typeof undefined?', ["'undefined'", "'object'", "'null'", "'undefined type'"], 0, "typeof undefined evaluates to the string 'undefined', one of JavaScript's primitive type tags."),
  mcq('Which array method creates a new array with the results of calling a function on every element?', ['forEach()', 'map()', 'filter()', 'reduce()'], 1, 'Array.prototype.map() runs a function on every element and returns a new array of the results, leaving the original array unchanged.'),
  mcq('What does the this keyword refer to inside a regular function called as a method?', ['The global object always', 'The object the method was called on', 'The function itself', 'undefined always'], 1, 'In a regular function called as obj.method(), this refers to obj — the object the method was invoked on.'),
  mcq('Which of these is used to handle asynchronous operations in modern JavaScript?', ['callbacks only', 'Promises and async/await', 'setInterval only', 'try/catch only'], 1, 'Modern JavaScript handles asynchronous code with Promises and the async/await syntax built on top of them.'),
  mcq('What does Array.isArray([]) return?', ['true', 'false', 'undefined', 'Error'], 0, 'Array.isArray() correctly identifies array instances; [] is an array, so it returns true.'),
  mcq('Which operator is used for strict inequality?', ['!=', '<>', '!==', 'not='], 2, '!== is the strict inequality operator — it returns true if the operands differ in value or type.'),
  mcq('What is a closure in JavaScript?', ['A function bundled with its lexical scope', 'A way to close the browser tab', 'A CSS property', 'A loop that never ends'], 0, 'A closure is a function that retains access to the variables from its enclosing scope even after that outer function has returned.'),
];

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

  const existingCount = await Quiz.countDocuments();
  if (existingCount > 0) {
    console.log(`${existingCount} quizzes already exist. Skipping.`);
    await mongoose.disconnect();
    return;
  }

  // Python Quiz belongs to AI & Data Science — Python is the language track
  // there, distinct from Web Development's HTML/CSS/JS quizzes below.
  const pythonQuiz = await Quiz.create({
    courseId: aiDs._id,
    module: 'Python Foundations',
    title: 'Python Quiz',
    questions: PYTHON_QUESTIONS,
    durationMinutes: 45,
  });

  await Quiz.create({
    courseId: webDev._id,
    module: 'HTML & CSS Foundations',
    title: 'HTML & CSS Quiz',
    questions: HTML_CSS_QUESTIONS,
    durationMinutes: 15,
  });

  await Quiz.create({
    courseId: webDev._id,
    module: 'JavaScript Foundations',
    title: 'JavaScript Basics Quiz',
    questions: JS_QUESTIONS,
    durationMinutes: 20,
  });

  // Recreate the real-screenshot scenario: a prior failed attempt on the
  // Python Quiz at 68% (34/50) — 34 correct answers, 16 deliberately wrong.
  const answers = PYTHON_QUESTIONS.map((q, i) =>
    i < 34 ? q.correctOptionIndex : (q.correctOptionIndex + 1) % 4
  );
  const startedAt = new Date();
  startedAt.setDate(startedAt.getDate() - 6);
  const submittedAt = new Date(startedAt.getTime() + 38 * 60 * 1000);

  await QuizAttempt.create({
    student: student._id,
    quiz: pythonQuiz._id,
    answers,
    score: 34,
    percentage: 68,
    status: 'failed',
    tabSwitchCount: 0,
    fullscreenExitCount: 0,
    startedAt,
    submittedAt,
    attemptNumber: 1,
  });

  console.log('Seeded 3 quizzes (Python Quiz w/ 50 questions, HTML & CSS Quiz, JavaScript Basics Quiz).');
  console.log(`Prior attempt seeded on Python Quiz: 34/50 (68%) — FAILED, for ${student.fullName}.`);

  await mongoose.disconnect();
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err.message);
    process.exit(1);
  });
