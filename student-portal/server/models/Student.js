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
    name: { type: String, trim: true },
    father: { type: String, trim: true },
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
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
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
    campus: { type: mongoose.Schema.Types.ObjectId, ref: 'Campus' },
    city: { type: String, trim: true },
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

module.exports = mongoose.model('Student', studentSchema);
