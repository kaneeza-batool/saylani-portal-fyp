const jwt = require('jsonwebtoken');
const Student = require('../models/Student');

async function protect(req, res, next) {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json({ message: 'Not authenticated' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // populate('campus') so every route downstream of this middleware
    // (getMe, getProfile, updateProfile, uploadAvatar) gets a real campus
    // name through toSafeStudent(), not a bare ObjectId — this is the one
    // place all of them load req.student from, so it has to happen here.
    const student = await Student.findById(decoded.id).populate('campus', 'name');
    if (!student) return res.status(401).json({ message: 'Not authenticated' });

    req.student = student;
    next();
  } catch {
    return res.status(401).json({ message: 'Not authenticated' });
  }
}

module.exports = { protect };
