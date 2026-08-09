const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Student = require('../models/Student');
const { sendPasswordResetEmail } = require('../utils/mailer');

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutes

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL = '7d';
const ACCESS_TOKEN_MAX_AGE_MS = 15 * 60 * 1000;
const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

// In production the frontend (Vercel) and backend (Railway) are different
// domains, so the auth cookies are cross-site — that requires sameSite:
// 'none', which browsers only honor when secure: true is also set. Locally
// both run on localhost (same-site), where sameSite: 'none' would actually
// be rejected without HTTPS, so this stays 'lax'/non-secure there.
const isProduction = process.env.NODE_ENV === 'production';
const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'lax',
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

// Silently renews the access token from the (still-valid) refresh token —
// this is what used to be missing entirely: the refresh token was being
// minted and cookied on login but nothing ever read it back. Without this,
// the access token's 15-minute expiry meant any gap longer than that
// between requests looked like a full logout on the next request, even
// though the student never explicitly logged out.
exports.refresh = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const student = await Student.findById(decoded.id);
    if (!student) return res.status(401).json({ message: 'Not authenticated' });

    // Only the access token is reissued — the refresh token keeps its
    // original 7-day expiry rather than being rotated on every silent
    // refresh, so a student doesn't get logged out mid-week just because
    // they had the app open across several access-token cycles.
    res.cookie('accessToken', signAccessToken(student), { ...cookieOptions, maxAge: ACCESS_TOKEN_MAX_AGE_MS });
    return res.status(200).json({ student: toSafeStudent(student) });
  } catch {
    return res.status(401).json({ message: 'Not authenticated' });
  }
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

// Always responds with the same message whether or not the CNIC actually
// exists, and whether or not the email send succeeds — this endpoint must
// never let someone probe which CNICs are registered or which have an
// email on file.
const GENERIC_RESET_MESSAGE = 'If an account exists for this CNIC, a password reset link has been sent to its email.';

exports.forgotPassword = async (req, res) => {
  try {
    const { cnic } = req.body;
    if (!cnic) return res.status(400).json({ message: 'CNIC is required' });

    const student = await Student.findOne({ cnic: normalizeCnic(cnic) });
    if (!student || !student.email) {
      return res.status(200).json({ message: GENERIC_RESET_MESSAGE });
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    student.resetPasswordTokenHash = hashToken(rawToken);
    student.resetPasswordExpires = new Date(Date.now() + RESET_TOKEN_TTL_MS);
    await student.save();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${rawToken}`;
    await sendPasswordResetEmail(student.email, resetUrl);

    return res.status(200).json({ message: GENERIC_RESET_MESSAGE });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to process request', error: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    if (!password || password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    }

    const student = await Student.findOne({
      resetPasswordTokenHash: hashToken(token),
      resetPasswordExpires: { $gt: new Date() },
    }).select('+resetPasswordTokenHash +resetPasswordExpires');

    if (!student) {
      return res.status(400).json({ message: 'This reset link is invalid or has expired. Please request a new one.' });
    }

    student.password = password;
    // Cleared, not left to expire naturally — a used token must never be
    // usable a second time even if someone captured it before expiry.
    student.resetPasswordTokenHash = undefined;
    student.resetPasswordExpires = undefined;
    await student.save();

    return res.status(200).json({ message: 'Password reset successful. You can now log in.' });
  } catch (err) {
    if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
    return res.status(500).json({ message: 'Failed to reset password', error: err.message });
  }
};
