const jwt = require('jsonwebtoken');
const Student = require('../models/Student');

// Shared token-verify + student-load — both `protect` and `protectAny`
// need exactly this, they just differ on whether Student.status also has
// to pass the portal-access allowlist afterward.
async function loadStudentFromToken(req) {
  const token = req.cookies.accessToken;
  if (!token) return null;

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  // populate('campus') so every route downstream of this middleware
  // (getMe, getProfile, updateProfile, uploadAvatar, dashboardController)
  // gets a real campus name/city through toSafeStudent()/activeCourse, not
  // a bare ObjectId — this is the one place all of them load req.student
  // from, so it has to happen here. city is included for
  // dashboardController's City fallback, now that Student.city itself
  // doesn't exist (see Student.js/Campus.js).
  return Student.findById(decoded.id).populate('campus', 'name city');
}

async function protect(req, res, next) {
  try {
    const student = await loadStudentFromToken(req);
    if (!student) return res.status(401).json({ message: 'Not authenticated' });

    // Central re-check, not just at login: status is re-read from the DB on
    // every request (not cached in the JWT), so if a Super Admin revokes an
    // already-logged-in student's portal access mid-session, their very
    // next request is cut off here rather than staying valid for the rest
    // of the access/refresh token's lifetime. Allowlist (Student.
    // PORTAL_ACCESS_STATUSES), not a blocklist — see that constant's
    // comment for why.
    if (!Student.PORTAL_ACCESS_STATUSES.includes(student.status)) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    req.student = student;
    next();
  } catch {
    return res.status(401).json({ message: 'Not authenticated' });
  }
}

// Same token check as `protect`, deliberately without the portal-access
// allowlist — a student whose admission is still pending (or rejected/
// dropped) has a real, valid session (see authController.setPassword/
// login), they just can't reach course content. Used only on the narrow
// slice of routes that make sense before approval: auth/me, auth/refresh,
// and the profile/onboarding routes (set up your account/photo while you
// wait) — every other route stays on the strict `protect` above.
async function protectAny(req, res, next) {
  try {
    const student = await loadStudentFromToken(req);
    if (!student) return res.status(401).json({ message: 'Not authenticated' });
    req.student = student;
    next();
  } catch {
    return res.status(401).json({ message: 'Not authenticated' });
  }
}

module.exports = { protect, protectAny };
