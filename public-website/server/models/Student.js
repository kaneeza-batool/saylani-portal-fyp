const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Real, create-capable copy of the shared Student model (see
// server/models/Student.js, the canonical schema) — not a read-only mirror
// like Campus.js below, because this app's job is to *create* a Student
// (status: 'pending') from the public enrollment form, landing it directly
// in the sub-admin Admissions Queue. Keep this in sync with the canonical
// schema by hand if that one changes; same tradeoff already accepted by
// student-portal's own Campus.js/Slot.js mirrors.
const COURSES = [
  'Web Development',
  'AI & Data Science',
  'Graphic Designing',
  'Mobile App Development (Flutter)',
  'Digital Marketing',
  'UI/UX Design',
  'Cybersecurity Fundamentals',
];

const STATUSES = ['enrolled', 'pending', 'completed', 'dropout', 'rejected'];
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
      match: [/^\d{13}$/, 'CNIC must be 13 digits'],
    },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    course: { type: String, required: true, enum: COURSES },
    campus: { type: mongoose.Schema.Types.ObjectId, ref: 'Campus', required: true, index: true },
    batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Slot', index: true },
    status: { type: String, enum: STATUSES, default: 'enrolled' },
    payment: { type: String, enum: PAYMENT_STATUSES, default: 'pending' },
    address: { type: String, default: '', trim: true },

    password: { type: String, minlength: 8, select: false },
    resetPasswordTokenHash: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },

    gender: { type: String, enum: ['male', 'female', 'other'] },
    dateOfBirth: { type: Date },
    lastQualification: { type: String, trim: true },
    avatarUrl: { type: String, default: '' },
    hasCompletedOnboarding: { type: Boolean, default: false },
    // Only field from the canonical schema's employment/background block
    // this app needs — it's the one question the public apply form actually
    // asks (EnrollNow.jsx's "Do you have a laptop?" step). Without declaring
    // it here, Student.create() below silently drops it (Mongoose strict
    // mode default on an undeclared path) even though applicationController
    // passes it through.
    hasLaptop: { type: Boolean, default: null },
  },
  { timestamps: true }
);

studentSchema.pre('validate', function assignRollNumber() {
  if (this.isNew && !this.rollNumber) {
    this.rollNumber = 100000 + Math.floor(Math.random() * 900000);
  }
});

studentSchema.pre('validate', function normalizeCnic() {
  if (this.cnic) {
    this.cnic = String(this.cnic).replace(/\D/g, '');
  }
});

studentSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

studentSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

const Student = mongoose.model('Student', studentSchema);
Student.COURSES = COURSES;
Student.STATUSES = STATUSES;
Student.PAYMENT_STATUSES = PAYMENT_STATUSES;

module.exports = Student;
