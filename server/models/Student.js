const mongoose = require('mongoose');

// Matches the fixed dropdown options from the design file's COURSES
// constant. Plain string enum, not a ref — there's no Course collection
// in this codebase yet to point at. campus, below, is a ref (see Campus.js).
const COURSES = [
  'Web Development',
  'AI & Data Science',
  'Graphic Designing',
  'Mobile App Development (Flutter)',
  'Digital Marketing',
  'UI/UX Design',
  'Cybersecurity Fundamentals',
];

const STATUSES = ['enrolled', 'pending', 'completed', 'dropout'];
const PAYMENT_STATUSES = ['paid', 'pending', 'overdue'];

const studentSchema = new mongoose.Schema(
  {
    rollNumber: { type: Number, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    father: { type: String, required: true, trim: true },
    cnic: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: [/^\d{5}-\d{7}-\d$/, 'CNIC must be in the format 12345-1234567-1'],
    },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    course: { type: String, required: true, enum: COURSES },
    campus: { type: mongoose.Schema.Types.ObjectId, ref: 'Campus', required: true, index: true },
    status: { type: String, enum: STATUSES, default: 'enrolled' },
    payment: { type: String, enum: PAYMENT_STATUSES, default: 'pending' },
    address: { type: String, default: '', trim: true },
  },
  { timestamps: true }
);

// Auto-assign a 6-digit roll number on creation (matches the format shown
// in the design reference, e.g. 844226) — collisions are vanishingly
// unlikely at this scale, and the unique index catches the rare case.
studentSchema.pre('validate', function assignRollNumber() {
  if (this.isNew && !this.rollNumber) {
    this.rollNumber = 100000 + Math.floor(Math.random() * 900000);
  }
});

const Student = mongoose.model('Student', studentSchema);
Student.COURSES = COURSES;
Student.STATUSES = STATUSES;
Student.PAYMENT_STATUSES = PAYMENT_STATUSES;

module.exports = Student;
