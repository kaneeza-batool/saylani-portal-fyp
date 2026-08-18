const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const AdminUser = require('../models/AdminUser');
const { logAdminAuthAttempt } = require('../utils/adminAuditLog');

const COOKIE_NAME = 'admin_token';
// In production the frontend and backend are deployed on different domains,
// so this cookie is cross-site — that requires sameSite: 'none', which
// browsers only honor when secure: true is also set. Locally both run on
// localhost (same-site), where sameSite: 'none' would actually be rejected
// without HTTPS, so this stays 'lax'/non-secure there (same pattern as
// student-portal/server/controllers/authController.js).
const isProduction = process.env.NODE_ENV === 'production';
const baseCookieOptions = {
  httpOnly: true,
  sameSite: isProduction ? 'none' : 'lax',
  secure: isProduction,
};

exports.login = async (req, res) => {
  const ip = req.ip;
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      logAdminAuthAttempt({ event: 'login_failure', email: email || '(none)', ip, reason: 'missing_fields' });
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const admin = await AdminUser.findOne({ email: email.toLowerCase().trim() });
    if (!admin) {
      logAdminAuthAttempt({ event: 'login_failure', email, ip, reason: 'no_such_account' });
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch) {
      logAdminAuthAttempt({ event: 'login_failure', email, ip, reason: 'wrong_password' });
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '8h' });
    res.cookie(COOKIE_NAME, token, { ...baseCookieOptions, maxAge: 8 * 60 * 60 * 1000 });

    logAdminAuthAttempt({ event: 'login_success', email: admin.email, ip });
    return res.status(200).json({ admin: { id: admin._id, email: admin.email, name: admin.name } });
  } catch (err) {
    logAdminAuthAttempt({ event: 'login_failure', email: req.body?.email, ip, reason: 'server_error' });
    return res.status(500).json({ message: 'Login failed', error: err.message });
  }
};

exports.logout = async (req, res) => {
  res.clearCookie(COOKIE_NAME, baseCookieOptions);
  return res.status(200).json({ message: 'Logged out.' });
};

exports.me = async (req, res) => {
  try {
    const admin = await AdminUser.findById(req.adminId).select('-passwordHash');
    if (!admin) {
      return res.status(401).json({ message: 'Not authenticated.' });
    }
    return res.status(200).json({ admin: { id: admin._id, email: admin.email, name: admin.name } });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch admin', error: err.message });
  }
};
