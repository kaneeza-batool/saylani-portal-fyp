const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Campus = require('../models/Campus');
const { logAudit } = require('../utils/auditLogger');

const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL = '7d';
const ACCESS_TOKEN_MAX_AGE_MS = 15 * 60 * 1000;
const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
};

function signAccessToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL });
}

function signRefreshToken(user) {
  return jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_TTL });
}

function setAuthCookies(res, user) {
  res.cookie('accessToken', signAccessToken(user), { ...cookieOptions, maxAge: ACCESS_TOKEN_MAX_AGE_MS });
  res.cookie('refreshToken', signRefreshToken(user), { ...cookieOptions, maxAge: REFRESH_TOKEN_MAX_AGE_MS });
}

// Async because campus_id needs a name attached for display (Profile page,
// etc.) — req.user itself is left alone (a raw ObjectId there is load-
// bearing: campusScope.js, checkPermission.js, and every campus-scoped
// query build off req.user.campus_id being a bare id, not a populated doc),
// this only shapes the outgoing JSON response.
async function toSafeUser(user) {
  let campus = user.campus_id || null;
  if (campus && !campus.name) {
    const doc = await Campus.findById(campus).select('name').lean();
    if (doc) campus = { _id: doc._id, name: doc.name };
  }
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    campus_id: campus,
    permissions: user.permissions,
    status: user.status,
    avatar_url: user.avatar_url,
  };
}

// Not wired to a route yet (only login/logout/me are exposed) — kept here
// so future "create user" admin flows and the seed script share the same
// hashing/validation path instead of duplicating it.
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, campus_id } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'name, email, password, and role are required' });
    }
    if (!User.ROLES.includes(role)) {
      return res.status(400).json({ message: `role must be one of: ${User.ROLES.join(', ')}` });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'Email is already registered' });

    const user = await User.create({ name, email, password, role, campus_id });
    logAudit({
      actor: user,
      action: 'create',
      resourceType: 'User',
      resourceId: user._id,
      summary: `Registered ${user.role} "${user.name}"`,
      resourceCampus: user.campus_id,
    });
    setAuthCookies(res, user);
    return res.status(201).json({ user: await toSafeUser(user) });
  } catch (err) {
    return res.status(500).json({ message: 'Registration failed', error: err.message });
  }
};

// Public self-service signup for trainers — deliberately separate from
// `register` above rather than exposing that generic function publicly:
// `register` trusts a client-supplied `role`, which would let anyone
// self-register as super_admin. This endpoint hardcodes role: 'trainer'
// server-side and never reads a role from the request body at all.
//
// Creates both the login-capable User (role: 'trainer') and a linked
// Trainer profile document in the same request, so a self-registered
// trainer immediately shows up in Super Admin's existing Trainers list —
// there's no separate "now make it visible to admins" step. The two
// documents aren't in a transaction (this deployment's Atlas tier doesn't
// reliably support multi-document transactions on a standalone/replica
// setup without extra config) — if Trainer creation fails after the User
// was already created, the error response still surfaces it as a 500 so
// it's not silently swallowed, and it's safe to retry (email/employeeId
// uniqueness prevents a duplicate on retry only if the User half also
// failed; a genuinely partial state here is rare and visible, not silent).
exports.registerTrainer = async (req, res) => {
  try {
    const { name, email, password, phone, course, campus_id } = req.body;
    if (!name || !email || !password || !campus_id) {
      return res.status(400).json({ message: 'Name, email, password, and campus are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    const campus = await Campus.findById(campus_id);
    if (!campus) return res.status(400).json({ message: 'Selected campus was not found' });

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(409).json({ message: 'Email is already registered' });

    const user = await User.create({
      name,
      email,
      password,
      role: 'trainer',
      campus_id: campus._id,
      status: 'active',
    });

    const Trainer = require('../models/Trainer');
    const employeeId = `TRN-SELF-${Date.now().toString(36).toUpperCase()}`;
    await Trainer.create({
      name,
      email,
      phone: phone || '',
      employeeId,
      course: course || '',
      city: campus.city,
      campus: campus._id,
      status: 'active',
    });

    logAudit({
      actor: user,
      action: 'create',
      resourceType: 'User',
      resourceId: user._id,
      summary: `Trainer "${user.name}" self-registered`,
      resourceCampus: user.campus_id,
    });

    setAuthCookies(res, user);
    return res.status(201).json({ user: await toSafeUser(user) });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'An account with this email already exists' });
    return res.status(500).json({ message: 'Registration failed', error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    if (user.status !== 'active') {
      return res.status(403).json({ message: 'This account is not active' });
    }

    setAuthCookies(res, user);
    return res.status(200).json({ user: await toSafeUser(user) });
  } catch (err) {
    return res.status(500).json({ message: 'Login failed', error: err.message });
  }
};

exports.logout = async (_req, res) => {
  res.clearCookie('accessToken', cookieOptions);
  res.clearCookie('refreshToken', cookieOptions);
  return res.status(200).json({ message: 'Logged out' });
};

exports.getMe = async (req, res) => {
  return res.status(200).json({ user: await toSafeUser(req.user) });
};

// Powers the Settings page — a user updating their own name/email/password.
// Deliberately separate from the admin-facing sub-admin/student/etc CRUD:
// no role/status changes here, and the current password must be confirmed
// before a new one is set.
exports.updateMe = async (req, res) => {
  try {
    const { name, email, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (name) user.name = name;
    if (email) user.email = email;

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Current password is required to set a new password' });
      }
      const matches = await user.comparePassword(currentPassword);
      if (!matches) return res.status(401).json({ message: 'Current password is incorrect' });
      user.password = newPassword;
    }

    await user.save();
    logAudit({
      actor: req.user,
      action: 'update',
      resourceType: 'User',
      resourceId: user._id,
      summary: `Updated own profile "${user.name}"`,
      resourceCampus: user.campus_id,
    });
    return res.status(200).json({ user: await toSafeUser(user) });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'Email is already in use' });
    if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
    return res.status(500).json({ message: 'Failed to update profile', error: err.message });
  }
};
