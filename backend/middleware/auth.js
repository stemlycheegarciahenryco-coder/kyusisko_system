// auth.js
const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  // Check Authorization header first, then fall back to cookie
  const authHeader = req.headers.authorization;
  const token = (authHeader && authHeader.startsWith('Bearer '))
    ? authHeader.split(' ')[1]
    : req.cookies.token;

  if (!token) {
    return res.status(403).json({ error: "Access denied. Please log in." });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.clearCookie('token');
    res.status(401).json({ error: "Invalid or expired session." });
  }
};

const isSubAdmin = (req, res, next) => {
  if (req.user.role !== 'sub_admin') {
    return res.status(403).json({ error: "Access denied. Sub-admins only." });
  }
  next();
};

const isStudent = (req, res, next) => {
  if (req.user.role !== 'student')
    return res.status(403).json({ error: "Access denied. Students only." });
  next();
};

module.exports = { verifyToken, isSubAdmin, isStudent };