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
const GRADE_OPTIONS = ['A+', 'A', 'B', 'C', 'D'];
const EMPLOYMENT_STATUSES = ['employed', 'unemployed'];
const COMPUTER_PROFICIENCY_LEVELS = ['beginner', 'intermediate', 'advanced'];

// Course-prefixed roll number (e.g. "GD-014" for Graphic Designing) — the
// prefix is purely cosmetic/derived from `course`, not a foreign key, so
// renaming a course here doesn't retag any already-issued roll number.
const COURSE_ROLL_PREFIXES = {
  'Web Development': 'WD',
  'AI & Data Science': 'AI',
  'Graphic Designing': 'GD',
  'Mobile App Development (Flutter)': 'MA',
  'Digital Marketing': 'DM',
  'UI/UX Design': 'UX',
  'Cybersecurity Fundamentals': 'CS',
};

// Sequence is computed from the current max suffix among roll numbers
// already carrying this prefix, not a stored counter — simple enough at
// this scale, and self-healing if a document is ever deleted (no gap
// tracking to keep in sync). Collisions from two concurrent creates
// computing the same "next" value are caught by the unique index below;
// callers (studentController.createStudent, applicationController.
// submitApplication) retry on that specific 11000 rather than failing the
// whole request.
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
    // Only meaningful while status is 'dropout' — tracks WHY, so the
    // automatic transitions in studentController.updateStudent and
    // alertEngine.js know which drops they're allowed to touch: a 'payment'
    // drop auto-restores when payment clears; an 'attendance' drop never
    // auto-restores (an admin must re-enroll manually); a 'manual' drop
    // (an admin explicitly chose it) is likewise never auto-restored. Never
    // set directly from client input — always derived server-side from
    // which field actually changed.
    dropReason: { type: String, enum: ['payment', 'attendance', 'manual', null], default: null },
    address: { type: String, default: '', trim: true },
    // Submitted at admission-application time (public-website's EnrollNow
    // form, all optional) — distinct from `avatarUrl` below, which is a
    // student-portal profile picture uploaded post-enrollment during
    // onboarding. These are never the same upload. CNIC front/back are
    // separate fields, not one "scan" — a CNIC has two sides and an
    // applicant needs to be able to attach both.
    applicationPhotoUrl: { type: String, default: '' },
    applicationCnicFrontUrl: { type: String, default: '' },
    applicationCnicBackUrl: { type: String, default: '' },
    // Overall course grade, set by a trainer on the Trainer Portal roster
    // page. No collection anywhere derives or aggregates this automatically
    // (assignment submissions have their own separate per-submission grade,
    // see StudentPortalAssignmentSubmission.grade) — this is a distinct,
    // trainer-entered judgment call, not a computed rollup.
    overallGrade: { type: String, enum: [...GRADE_OPTIONS, null], default: null },

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

    // ---- Employment/placement tracking, admin-entered via
    // StudentFormModal (unlike gender/dateOfBirth/lastQualification above,
    // which are self-reported on student-portal). All optional — 66
    // pre-existing students have none of these set. No `updatedBy`/
    // `lastUpdatedAt` here: AuditLog already records actorName + createdAt
    // for every 'update' action on resourceType 'Student', so that's
    // answered there rather than duplicated on the document.
    employmentStatus: { type: String, enum: [...EMPLOYMENT_STATUSES, null], default: null },
    salary: { type: Number, min: 0 },
    companyName: { type: String, trim: true },
    jobTitle: { type: String, trim: true },
    employmentStartDate: { type: Date },
    computerProficiency: { type: String, enum: [...COMPUTER_PROFICIENCY_LEVELS, null], default: null },
    hasLaptop: { type: Boolean, default: null },
    // Gates student-portal's mandatory "Complete Your Profile" onboarding
    // step — set true the first time an avatar is uploaded, not derived
    // from avatarUrl being non-empty, so clearing an avatar later doesn't
    // force a student back through onboarding.
    hasCompletedOnboarding: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Auto-assign a course-prefixed roll number on creation (e.g. "GD-014" for
// Graphic Designing) — set once at registration and never touched again by
// this hook (findOneAndUpdate-based edits don't run it anyway, see
// studentController.updateStudent, which regenerates it explicitly only
// when `course` actually changes).
studentSchema.pre('validate', async function assignRollNumber() {
  if (this.isNew && !this.rollNumber && this.course) {
    this.rollNumber = await nextRollNumberFor(this.constructor, this.course);
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
Student.GRADE_OPTIONS = GRADE_OPTIONS;
Student.EMPLOYMENT_STATUSES = EMPLOYMENT_STATUSES;
Student.COMPUTER_PROFICIENCY_LEVELS = COMPUTER_PROFICIENCY_LEVELS;
Student.COURSE_ROLL_PREFIXES = COURSE_ROLL_PREFIXES;
Student.generateRollNumber = (course) => nextRollNumberFor(Student, course);
Student.formatCnic = formatCnic;

module.exports = Student;
