const jwt = require('jsonwebtoken');
const Student = require('../models/Student');

async function protect(req, res, next) {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json({ message: 'Not authenticated' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const student = await Student.findById(decoded.id);
    if (!student) return res.status(401).json({ message: 'Not authenticated' });

    req.student = student;
    next();
  } catch {
    return res.status(401).json({ message: 'Not authenticated' });
  }
}

module.exports = { protect };
