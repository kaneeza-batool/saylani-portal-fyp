const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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

const STATUSES = ['enrolled', 'pending', 'completed', 'dropout', 'rejected'];
const PAYMENT_STATUSES = ['paid', 'pending', 'overdue'];

const studentSchema = new mongoose.Schema(
  {
    rollNumber: { type: Number, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    father: { type: String, required: true, trim: true },
    // Stored as 13 bare digits (no dashes) — normalized on write by the
    // pre-validate hook below, so both "12345-1234567-1" and "1234512345671"
    // land on the same stored value. The dashed form is display-only now
    // (see Student.formatCnic) — student-portal's login lookup already
    // strips non-digits before querying, so this is the format that keeps
    // both apps compatible.
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
    // Not required — existing records predate this field, and applicants
    // (status 'pending'/'rejected') are never placed in a batch at all.
    batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Slot', index: true },
    status: { type: String, enum: STATUSES, default: 'enrolled' },
    payment: { type: String, enum: PAYMENT_STATUSES, default: 'pending' },
    address: { type: String, default: '', trim: true },

    // ---- Student-portal auth + profile fields (merged in from
    // student-portal's own Student model — see shared-data migration
    // notes). select: false on all three auth fields so a bare find()/
    // findOne() never returns them; every route that needs the password
    // must opt in with an explicit .select('+password'), and only
    // student-portal's authController does that. ----
    password: { type: String, minlength: 8, select: false },
    resetPasswordTokenHash: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },

    gender: { type: String, enum: ['male', 'female', 'other'] },
    dateOfBirth: { type: Date },
    lastQualification: { type: String, trim: true },
    avatarUrl: { type: String, default: '' },
    // Gates student-portal's mandatory "Complete Your Profile" onboarding
    // step — set true the first time an avatar is uploaded, not derived
    // from avatarUrl being non-empty, so clearing an avatar later doesn't
    // force a student back through onboarding.
    hasCompletedOnboarding: { type: Boolean, default: false },
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

// Runs before the cnic `match` validator above (both are pre-validate,
// and hooks run in declaration order), so a dashed input like
// "12345-1234567-1" is reduced to bare digits before the /^\d{13}$/ check
// ever sees it — accepting either input shape at the API boundary while
// only ever storing one.
studentSchema.pre('validate', function normalizeCnic() {
  if (this.cnic) {
    this.cnic = String(this.cnic).replace(/\D/g, '');
  }
});

// Document middleware (pre('validate')/pre('save')) never runs on
// findOneAndUpdate/findByIdAndUpdate — those go through query middleware
// instead, even with runValidators: true. studentController.updateStudent
// updates cnic this way, so without this second hook a dashed CNIC would
// reach the /^\d{13}$/ match validator unnormalized and get rejected
// instead of accepted-and-normalized like the create path.
studentSchema.pre('findOneAndUpdate', function normalizeCnicOnUpdate() {
  const update = this.getUpdate();
  if (update?.cnic) {
    update.cnic = String(update.cnic).replace(/\D/g, '');
  }
});

studentSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

studentSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Display-only formatter for the bare-digit stored form — the inverse of
// normalizeCnic above. Not a schema field; call this wherever the UI wants
// the traditional "12345-1234567-1" shape.
function formatCnic(bareCnic) {
  const digits = String(bareCnic || '').replace(/\D/g, '');
  if (digits.length !== 13) return bareCnic || '';
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
}

const Student = mongoose.model('Student', studentSchema);
Student.COURSES = COURSES;
Student.STATUSES = STATUSES;
Student.PAYMENT_STATUSES = PAYMENT_STATUSES;
Student.formatCnic = formatCnic;

module.exports = Student;
