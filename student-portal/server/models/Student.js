const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const studentSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    fatherName: { type: String, required: true, trim: true },
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
    campus: { type: String, trim: true },
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
