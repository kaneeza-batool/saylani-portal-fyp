const jwt = require('jsonwebtoken');
const Student = require('../models/Student');

async function protect(req, res, next) {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json({ message: 'Not authenticated' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // populate('campus') so every route downstream of this middleware
    // (getMe, getProfile, updateProfile, uploadAvatar, dashboardController)
    // gets a real campus name/city through toSafeStudent()/activeCourse, not
    // a bare ObjectId — this is the one place all of them load req.student
    // from, so it has to happen here. city is included for
    // dashboardController's City fallback, now that Student.city itself
    // doesn't exist (see Student.js/Campus.js).
    const student = await Student.findById(decoded.id).populate('campus', 'name city');
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

module.exports = { protect };
