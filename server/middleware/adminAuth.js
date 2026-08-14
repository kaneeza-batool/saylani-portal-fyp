const jwt = require('jsonwebtoken');

const requireAdminAuth = (req, res, next) => {
  const token = req.cookies?.admin_token;
  if (!token) {
    return res.status(401).json({ message: 'Not authenticated.' });
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.adminId = payload.id;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired session.' });
  }
};

module.exports = requireAdminAuth;
