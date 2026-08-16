const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Student = require('../models/Student');
require('../models/Campus'); // registers 'Campus' so .populate('campus') resolves it
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

// Same "compare digits only" reasoning as normalizeCnic — a student re-typing
// their own phone number from memory shouldn't fail this check over a
// dash/space/country-code formatting difference from however staff originally
// entered it.
function normalizePhone(phone) {
  return String(phone || '').replace(/\D/g, '');
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
    // Sourced from name/father (the shared document's real fields, see
    // Student.js) — fullName/fatherName no longer exist on the document
    // itself, only as this response's outward JSON keys, unchanged so the
    // frontend doesn't need to know anything moved.
    fullName: student.name,
    fatherName: student.father,
    cnic: student.cnic,
    phone: student.phone,
    email: student.email,
    address: student.address,
    gender: student.gender,
    dateOfBirth: student.dateOfBirth,
    lastQualification: student.lastQualification,
    avatarUrl: student.avatarUrl,
    hasCompletedOnboarding: student.hasCompletedOnboarding,
    // campus is now a populated ref (see Student.js) — only ever a name
    // string here, never the ObjectId/document itself. null if somehow
    // unpopulated rather than leaking a Mongoose document.
    campus: student.campus?.name || null,
    role: student.role,
    // Added for the ID Card view (Profile page) — same hydration reasoning
    // as avatarUrl above, these were already on the shared document but
    // never exposed to the frontend before now.
    rollNumber: student.rollNumber,
    course: student.course,
    // Raw status — PendingApprovalPage picks specific copy for pending vs
    // rejected vs dropout from this. portalAccess below is the derived
    // yes/no the rest of the app actually gates on; this is only for
    // choosing which message to show, not a security boundary itself —
    // that's still enforced server-side by protect()/protectAny().
    status: student.status,
    portalAccess: Student.PORTAL_ACCESS_STATUSES.includes(student.status),
  };
}

exports.toSafeStudent = toSafeStudent;

// One message per denied status, keyed by the exact enum values in
// Student.STATUSES (main app) — a status with no entry here still gets
// denied by the allowlist check below, just with DEFAULT_DENIED_MESSAGE
// instead of a status-specific one, so a future status never has to be
// added here before it's safely denied.
const PORTAL_ACCESS_DENIED_MESSAGES = {
  pending: 'Your enrollment is still pending approval. You’ll be able to log in once a Super Admin reviews your application.',
  rejected: 'Your application was not approved. Please contact the admissions office for details.',
  dropout: 'Your enrollment has been marked as withdrawn, so Student Portal access is no longer available. Contact the admissions office if you believe this is a mistake.',
};
const DEFAULT_DENIED_MESSAGE = 'Your account does not currently have portal access. Please contact the admissions office.';

exports.login = async (req, res) => {
  try {
    const { cnic, password } = req.body;
    if (!cnic || !password) {
      return res.status(400).json({ message: 'CNIC and password are required' });
    }

    const student = await Student.findOne({ cnic: normalizeCnic(cnic) })
      .select('+password')
      .populate('campus', 'name');
    if (!student || !student.password || !(await student.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid CNIC or password' });
    }

    // Credentials alone are enough for a real session now — a student whose
    // admission is still pending (or rejected/dropped) still gets logged
    // in, just scoped to protectAny()'s narrow route slice (profile/
    // onboarding) rather than the full portal, which stays gated behind
    // the strict protect() allowlist on every other route (Student.
    // PORTAL_ACCESS_STATUSES). toSafeStudent's portalAccess flag tells the
    // frontend which experience to show; it's a UI hint, not the security
    // boundary — that's still enforced server-side per-route.
    setAuthCookies(res, student);
    const safeStudent = toSafeStudent(student);
    return res.status(200).json({
      student: safeStudent,
      message: safeStudent.portalAccess ? null : PORTAL_ACCESS_DENIED_MESSAGES[student.status] || DEFAULT_DENIED_MESSAGE,
    });
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
    const student = await Student.findById(decoded.id).populate('campus', 'name');
    if (!student) return res.status(401).json({ message: 'Not authenticated' });
    // No portal-access check here — a pending student's session still
    // needs to stay alive past 15 minutes to finish onboarding, same
    // reasoning as login/setPassword. protect() re-checks status on every
    // portal route regardless of how fresh the access token is.

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
// record staff already created, and whether it still needs a password (a
// first-time setup) or already has one (a recreation, which setPassword
// below additionally requires the phone on file for — see its comment).
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

// Step 2 of "Create Password". Two paths:
//  - No password yet (first-time setup): CNIC alone is enough, unchanged
//    from before.
//  - A password already exists (recreation — the student forgot it and
//    doesn't want to depend on email-based Forgot Password): CNIC alone is
//    deliberately NOT enough here, and never should be — a CNIC is exactly
//    the kind of semi-public identifier (shown on admission forms, known to
//    family/staff) that must never be sufficient on its own to take over an
//    account. Instead, `phone` is required as a second identifying field and
//    checked against the phone already on file; only a match is allowed to
//    proceed.
// Either way this updates the SAME student document in place (never
// creates a new one), so attendance/fees/quiz history are untouched by
// construction.
exports.setPassword = async (req, res) => {
  try {
    const { cnic, phone, password } = req.body;
    if (!cnic || !password) {
      return res.status(400).json({ message: 'CNIC and password are required' });
    }

    const student = await Student.findOne({ cnic: normalizeCnic(cnic) })
      .select('+password')
      .populate('campus', 'name');
    if (!student) {
      return res.status(404).json({ message: 'No student found with this CNIC. Please contact your campus.' });
    }
    if (student.password) {
      if (!phone) {
        return res.status(400).json({
          message: 'This account already has a password. Enter the phone number on file to create a new one.',
          requiresPhone: true,
        });
      }
      if (normalizePhone(phone) !== normalizePhone(student.phone)) {
        return res.status(401).json({ message: "That phone number doesn't match our records." });
      }
    }

    student.password = password;
    await student.save();

    // Real session either way — a pending applicant gets to finish
    // onboarding (profile/avatar routes use protectAny, see
    // authMiddleware.js) but nothing past that (every other route stays on
    // the strict protect() allowlist). Bug this used to have: a cookie was
    // issued but EVERY route including onboarding required full portal
    // access, so a pending student looked logged in and then failed on the
    // very next click with a bare "Not authenticated" and no explanation.
    setAuthCookies(res, student);
    const safeStudent = toSafeStudent(student);

    return res.status(201).json({
      student: safeStudent,
      message: safeStudent.portalAccess ? null : PORTAL_ACCESS_DENIED_MESSAGES[student.status] || DEFAULT_DENIED_MESSAGE,
    });
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
