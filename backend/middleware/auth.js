// auth.js
const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  // FIX: Cookie is the primary auth mechanism for the browser frontend.
  // The httpOnly cookie cannot be read by JavaScript (XSS-safe), and is
  // attached automatically on every request via withCredentials:true in api.js.
  // Bearer header is kept as a fallback ONLY for non-browser API clients
  // (e.g. Postman, mobile apps, server-to-server calls).
  const authHeader = req.headers.authorization;
  const token = req.cookies?.token
    || (authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null);

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