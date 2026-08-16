const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const studentSchema = new mongoose.Schema(
  {
    // fullName/fatherName are vestigial — no document in the shared
    // collection has ever had these keys (the admin side calls them name/
    // father instead, see below), and nothing here writes them. Left
    // declared rather than removed so any other controller still reading
    // student.fullName/.fatherName directly keeps its exact current
    // (already-undefined) behavior. No longer required: true — that was
    // safe when this schema's own Student.create() populated them, but
    // now every req.student.save() (updateProfile, uploadAvatar,
    // setPassword, forgotPassword, resetPassword) would otherwise fail
    // validation on a field that can structurally never be set.
    fullName: { type: String, trim: true },
    fatherName: { type: String, trim: true },
    // The shared document's real name fields — added so Mongoose actually
    // hydrates them (a path with no schema declaration is dropped on read,
    // strict mode default). toSafeStudent() below sources fullName/
    // fatherName's *output* from these, keeping the JSON response shape
    // the rest of this app's frontend already expects.
    // required: true to match the canonical schema (server/models/Student.js)
    // — a raw-collection audit confirmed all 129 documents already have
    // non-null, non-empty values for these, so this only tightens
    // validation on future partial saves, it doesn't retroactively affect
    // any existing document.
    name: { type: String, trim: true, required: true },
    father: { type: String, trim: true, required: true },
    cnic: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: [/^\d{13}$/, 'CNIC must be 13 digits'],
    },
    password: { type: String, minlength: 8, select: false },
    // Forgot-password flow — hashed (never store the raw token, same
    // reasoning as the password itself) with an expiry, cleared once used.
    resetPasswordTokenHash: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
    phone: { type: String, trim: true, required: true },
    email: { type: String, trim: true, lowercase: true, required: true },
    address: { type: String, trim: true, default: '' },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    dateOfBirth: { type: Date },
    lastQualification: { type: String, trim: true },
    avatarUrl: { type: String, default: '' },
    // Set true the first time an avatar is ever uploaded (see
    // studentController.uploadAvatar) — the mandatory "Complete Your
    // Profile" onboarding step (ProtectedRoute) gates on THIS flag, not on
    // avatarUrl being non-empty, so a student who later clears their avatar
    // from the Profile edit page never gets forced back through onboarding.
    hasCompletedOnboarding: { type: Boolean, default: false },
    // Was a plain display String; the shared document's campus is a real
    // ObjectId ref (main's Student.campus — see Campus.js in this same
    // models folder, a minimal read-only mirror). toSafeStudent() below
    // populates this and outputs just the name, so the API response shape
    // (a plain string) doesn't change for the frontend.
    campus: { type: mongoose.Schema.Types.ObjectId, ref: 'Campus', required: true },
    city: { type: String, trim: true },
    // One-course-per-student fields from the shared document (see
    // server/models/Student.js in the main app) — added for the same
    // hydration reason as name/father above. course is a plain name string
    // (no Course collection backs it), batch is a ref to the main app's
    // Slot model (see Slot.js, a minimal read-only mirror).
    course: { type: String, trim: true },
    batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Slot' },
    payment: { type: String, trim: true },
    rollNumber: { type: Number },
    // Admission/approval state from the shared document (main app's
    // Student.status — see server/models/Student.js and
    // admissionController.js, which is the only place this ever changes).
    // Mirrored read-only for the same hydration reason as course/campus
    // above: without declaring it here, authMiddleware's portal-access gate
    // would always see `undefined` and never block anyone, even though the
    // underlying document genuinely has the field set. Enum values copied
    // verbatim from the main app's Student.STATUSES — never invent new ones
    // here, this schema only mirrors what the canonical model declares.
    status: { type: String, enum: ['enrolled', 'pending', 'completed', 'dropout', 'rejected'], default: 'enrolled' },
    // Mirrored for the same reason as status above — why a 'dropout'
    // happened (auto-dropout on overdue payment/low attendance, vs a
    // manual admin action). Enum copied verbatim from the canonical
    // schema (server/models/Student.js) — never invent new values here.
    dropReason: { type: String, enum: ['payment', 'attendance', 'manual', null], default: null },
    // Mirrored for the same reason as status/dropReason above — set by a
    // trainer on the Trainer Portal roster page (see server/models/
    // Student.js), read-only here. Enum copied verbatim from the canonical
    // schema — never invent new values here.
    overallGrade: { type: String, enum: ['A+', 'A', 'B', 'C', 'D', null], default: null },
    // Employment/placement fields from the shared document (main app's
    // Student model — see server/models/Student.js), mirrored read-only for
    // the same hydration reason as status/course above: an undeclared path
    // is silently dropped on every read here, strict mode default. Enum
    // values copied verbatim from the canonical schema — never invent new
    // ones here.
    employmentStatus: { type: String, enum: ['employed', 'unemployed', null], default: null },
    salary: { type: Number, min: 0 },
    companyName: { type: String, trim: true },
    jobTitle: { type: String, trim: true },
    employmentStartDate: { type: Date },
    computerProficiency: { type: String, enum: ['beginner', 'intermediate', 'advanced', null], default: null },
    hasLaptop: { type: Boolean, default: null },
    // kept as a field (not yet an enum tied to other portals) so this
    // collection can merge with super-admin-portal's role system later
    role: { type: String, default: 'student' },
  },
  { timestamps: true }
);

studentSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

studentSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

const Student = mongoose.model('Student', studentSchema);

// Allowlist, not a blocklist — anything not explicitly listed here is
// denied portal access by default, so a status added later to the main
// app's Student.STATUSES doesn't silently gain access here until someone
// deliberately opts it in. The three enforcement points (login, refresh,
// protect in authMiddleware.js) all check membership in this one list
// rather than each maintaining their own denied-statuses logic.
Student.PORTAL_ACCESS_STATUSES = ['enrolled', 'completed'];

module.exports = Student;
