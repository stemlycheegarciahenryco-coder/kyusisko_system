const jwt = require('jsonwebtoken');



//TOKENN BEARERRRRR


const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1]; // Expects "Bearer TOKEN"

  if (!token) {
    return res.status(403).json({ error: "Access denied. No token provided." });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified; // Adds user info (id, role) to the request object
    next(); // Moves to the actual route logic
  } catch (err) {
    res.status(401).json({ error: "Invalid or expired token." });
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