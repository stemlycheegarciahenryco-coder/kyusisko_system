// auth.js
const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  // Now checks the 'token' cookie instead of Authorization header
  const token = req.cookies.token;

  if (!token) {
    return res.status(403).json({ error: "Access denied. Please log in." });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified; 
    next();
  } catch (err) {
    res.clearCookie('token'); // Clean up invalid cookies
    res.status(401).json({ error: "Invalid or expired session." });
  }
};

// only sub_admins can pass
const isSubAdmin = (req, res, next) => {
  // Level 1 = Sub-admin/Donor
  if (req.user.role !== 'sub_admin') {
    return res.status(403).json({ error: "Access denied. Sub-admins only." });
  }
  next();
};

// only students can pass
const isStudent = (req, res, next) => {
  if (req.user.role !== 'student')
    return res.status(403).json({ error: "Access denied. Students only." });
  next();
};

module.exports = { verifyToken, isSubAdmin, isStudent };