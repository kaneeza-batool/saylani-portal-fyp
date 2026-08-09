const jwt = require('jsonwebtoken');
const Student = require('../models/Student');

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

function normalizeCnic(cnic) {
  return String(cnic || '').replace(/\D/g, '');
}

function signAccessToken(student) {
  return jwt.sign({ id: student._id }, process.env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL });
}

function signRefreshToken(student) {
  return jwt.sign({ id: student._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_TTL });
}

function setAuthCookies(res, student) {
  res.cookie('accessToken', signAccessToken(student), { ...cookieOptions, maxAge: ACCESS_TOKEN_MAX_AGE_MS });
  res.cookie('refreshToken', signRefreshToken(student), { ...cookieOptions, maxAge: REFRESH_TOKEN_MAX_AGE_MS });
}

function toSafeStudent(student) {
  return {
    id: student._id,
    fullName: student.fullName,
    fatherName: student.fatherName,
    cnic: student.cnic,
    phone: student.phone,
    email: student.email,
    address: student.address,
    gender: student.gender,
    dateOfBirth: student.dateOfBirth,
    lastQualification: student.lastQualification,
    avatarUrl: student.avatarUrl,
    hasCompletedOnboarding: student.hasCompletedOnboarding,
    campus: student.campus,
    city: student.city,
    role: student.role,
  };
}

exports.toSafeStudent = toSafeStudent;

exports.login = async (req, res) => {
  try {
    const { cnic, password } = req.body;
    if (!cnic || !password) {
      return res.status(400).json({ message: 'CNIC and password are required' });
    }

    const student = await Student.findOne({ cnic: normalizeCnic(cnic) }).select('+password');
    if (!student || !student.password || !(await student.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid CNIC or password' });
    }

    setAuthCookies(res, student);
    return res.status(200).json({ student: toSafeStudent(student) });
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
  return res.status(200).json({ student: toSafeStudent(req.student) });
};

// Step 1 of "Create Password": confirm the CNIC belongs to a student
// record staff already created, and whether it still needs a password.
exports.verifyCnic = async (req, res) => {
  try {
    const { cnic } = req.body;
    if (!cnic) return res.status(400).json({ message: 'CNIC is required' });

    const student = await Student.findOne({ cnic: normalizeCnic(cnic) }).select('+password');
    if (!student) {
      return res.status(404).json({ message: 'No student found with this CNIC. Please contact your campus.' });
    }

    return res.status(200).json({ verified: true, hasPassword: Boolean(student.password) });
  } catch (err) {
    return res.status(500).json({ message: 'CNIC verification failed', error: err.message });
  }
};

// Step 2 of "Create Password": only allowed while the account has no
// password yet, so this can't be used to hijack an already-active account.
exports.setPassword = async (req, res) => {
  try {
    const { cnic, password } = req.body;
    if (!cnic || !password) {
      return res.status(400).json({ message: 'CNIC and password are required' });
    }

    const student = await Student.findOne({ cnic: normalizeCnic(cnic) }).select('+password');
    if (!student) {
      return res.status(404).json({ message: 'No student found with this CNIC. Please contact your campus.' });
    }
    if (student.password) {
      return res.status(409).json({ message: 'Password already set for this account. Please log in instead.' });
    }

    student.password = password;
    await student.save();

    setAuthCookies(res, student);
    return res.status(201).json({ student: toSafeStudent(student) });
  } catch (err) {
    if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
    return res.status(500).json({ message: 'Failed to set password', error: err.message });
  }
};
