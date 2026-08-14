const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ROLES = ['super_admin', 'sub_admin', 'trainer', 'student', 'employer'];

const permissionShape = (actions) =>
  actions.reduce((acc, action) => {
    acc[action] = { type: Boolean, default: false };
    return acc;
  }, {});

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: ROLES, required: true },
    campus_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campus',
      default: null,
      validate: {
        validator(value) {
          return this.role === 'sub_admin' ? Boolean(value) : true;
        },
        message: 'campus_id is required for sub_admin users',
      },
    },
    permissions: {
      STUDENT: permissionShape(['read', 'write', 'update']),
      ATTENDANCE_VIEW: permissionShape(['read', 'write']),
      ATTENDANCE_MARK: permissionShape(['read', 'write', 'update']),
      ATTENDANCE_ADD_MULTI: permissionShape(['read', 'write', 'update']),
      TRAINER: permissionShape(['read', 'write']),
      TRAINER_ATTENDANCE_MARK: permissionShape(['read', 'write', 'update']),
      TRAINER_ATTENDANCE_VIEW: permissionShape(['read', 'write']),
      BATCH: permissionShape(['read', 'write', 'update']),
      ADMISSIONS: permissionShape(['read', 'write', 'update']),
      FEEDBACK: permissionShape(['read']),
      ALERTS: permissionShape(['read']),
      AUDIT: permissionShape(['read']),
    },
    status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
    avatar_url: { type: String, default: '' },
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

const User = mongoose.model('User', userSchema);
User.ROLES = ROLES;

module.exports = User;
