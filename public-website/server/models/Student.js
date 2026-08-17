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

// Course-prefixed roll number (e.g. "GD-014") — kept in sync by hand with
// server/models/Student.js's own copy, same tradeoff as the rest of this file.
const COURSE_ROLL_PREFIXES = {
  'Web Development': 'WD',
  'AI & Data Science': 'AI',
  'Graphic Designing': 'GD',
  'Mobile App Development (Flutter)': 'MA',
  'Digital Marketing': 'DM',
  'UI/UX Design': 'UX',
  'Cybersecurity Fundamentals': 'CS',
};

async function nextRollNumberFor(Model, course) {
  const prefix = COURSE_ROLL_PREFIXES[course] || 'ST';
  const existing = await Model.find({ rollNumber: { $regex: `^${prefix}-\\d+$` } }, 'rollNumber').lean();
  const max = existing.reduce((m, doc) => {
    const n = parseInt(String(doc.rollNumber).slice(prefix.length + 1), 10);
    return Number.isFinite(n) && n > m ? n : m;
  }, 0);
  return `${prefix}-${String(max + 1).padStart(3, '0')}`;
}

const studentSchema = new mongoose.Schema(
  {
    rollNumber: { type: String, unique: true, index: true },
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
    // Never set by this app (why a dropout happened, or an admin-entered
    // course grade), but declared anyway — without it, any future read of a
    // Student through this model silently drops whatever the main app
    // already wrote there, same class of bug the canonical schema's own
    // drift-check script exists to catch.
    dropReason: { type: String, enum: ['payment', 'attendance', 'manual', null], default: null },
    overallGrade: { type: String, enum: ['A+', 'A', 'B', 'C', 'D', null], default: null },
    address: { type: String, default: '', trim: true },
    // Optional, set by this app's own EnrollNow form (see
    // applicationController.submitApplication) — distinct from avatarUrl
    // below, a student-portal profile picture uploaded post-enrollment.
    // CNIC front/back are separate fields, not one "scan" — a CNIC has two
    // sides and an applicant needs to be able to attach both.
    applicationPhotoUrl: { type: String, default: '' },
    applicationCnicFrontUrl: { type: String, default: '' },
    applicationCnicBackUrl: { type: String, default: '' },

    password: { type: String, minlength: 8, select: false },
    resetPasswordTokenHash: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },

    gender: { type: String, enum: ['male', 'female', 'other'] },
    dateOfBirth: { type: Date },
    lastQualification: { type: String, trim: true },
    avatarUrl: { type: String, default: '' },
    hasCompletedOnboarding: { type: Boolean, default: false },
    // hasLaptop is the one employment/background field the public apply
    // form actually asks (EnrollNow.jsx's "Do you have a laptop?" step),
    // and the only one this app ever writes. The rest below are never set
    // here either, declared for the same silent-drop reason as
    // dropReason/overallGrade above.
    hasLaptop: { type: Boolean, default: null },
    employmentStatus: { type: String, enum: ['employed', 'unemployed', null], default: null },
    salary: { type: Number, min: 0 },
    companyName: { type: String, trim: true },
    jobTitle: { type: String, trim: true },
    employmentStartDate: { type: Date },
    computerProficiency: { type: String, enum: ['beginner', 'intermediate', 'advanced', null], default: null },
  },
  { timestamps: true }
);

studentSchema.pre('validate', async function assignRollNumber() {
  if (this.isNew && !this.rollNumber && this.course) {
    this.rollNumber = await nextRollNumberFor(this.constructor, this.course);
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
Student.COURSE_ROLL_PREFIXES = COURSE_ROLL_PREFIXES;
Student.generateRollNumber = (course) => nextRollNumberFor(Student, course);

module.exports = Student;
