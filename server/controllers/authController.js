const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Campus = require('../models/Campus');
const { logAudit } = require('../utils/auditLogger');

const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL = '7d';
const ACCESS_TOKEN_MAX_AGE_MS = 15 * 60 * 1000;
const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

// In production the frontend and backend are deployed on different domains,
// so the auth cookies are cross-site — that requires sameSite: 'none', which
// browsers only honor when secure: true is also set. Locally both run on
// localhost (same-site), where sameSite: 'none' would actually be rejected
// without HTTPS, so this stays 'lax'/non-secure there (same pattern as
// student-portal/server/controllers/authController.js).
const isProduction = process.env.NODE_ENV === 'production';
const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'lax',
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

// Silently renews the access token from the (still-valid) refresh token —
// mirrors student-portal's authController.refresh exactly. Without this,
// the access token's 15-minute expiry looked like a full logout on any
// request gap longer than that, even though the 7-day refresh token was
// still valid and being minted at login all along.
exports.refresh = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: 'Not authenticated' });

    // Only the access token is reissued — the refresh token keeps its
    // original 7-day expiry rather than being rotated on every silent
    // refresh (same reasoning as student-portal's version).
    res.cookie('accessToken', signAccessToken(user), { ...cookieOptions, maxAge: ACCESS_TOKEN_MAX_AGE_MS });
    return res.status(200).json({ user: await toSafeUser(user) });
  } catch {
    return res.status(401).json({ message: 'Not authenticated' });
  }
};

exports.logout = async (_req, res) => {
  res.clearCookie('accessToken', cookieOptions);
  res.clearCookie('refreshToken', cookieOptions);
  return res.status(200).json({ message: 'Logged out' });
};

exports.getMe = async (req, res) => {
  try {
    return res.status(200).json({ user: await toSafeUser(req.user) });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load profile', error: err.message });
  }
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
