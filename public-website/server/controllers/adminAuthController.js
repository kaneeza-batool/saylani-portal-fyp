const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const AdminUser = require('../models/AdminUser');

const COOKIE_NAME = 'admin_token';
const baseCookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const admin = await AdminUser.findOne({ email: email.toLowerCase().trim() });
    if (!admin) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '8h' });
    res.cookie(COOKIE_NAME, token, { ...baseCookieOptions, maxAge: 8 * 60 * 60 * 1000 });

    return res.status(200).json({ admin: { id: admin._id, email: admin.email, name: admin.name } });
  } catch (err) {
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
