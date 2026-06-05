// controllers/searchController.js
const pool = require('../config/db');

exports.globalSearch = async (req, res) => {
  try {
    const { q, type = 'all' } = req.query;
    
    if (!q || q.trim() === '') {
      return res.status(200).json({ scholarships: [], organizations: [] });
    }

    const searchKeyword = `%${q}%`;
    let scholarships = [];
    let organizations = [];

    // 1. Query matching active scholarships with a valid deadline
    if (type === 'all' || type === 'scholarships') {
      const scholarshipQuery = `
        SELECT id, title, description, amount_range, criteria, deadline
        FROM scholarships 
        WHERE (taken_down = FALSE OR taken_down IS NULL) 
          AND (deadline >= CURRENT_DATE OR deadline IS NULL)
          AND (title ILIKE $1 OR description ILIKE $1)
        LIMIT 5;
      `;
      const scholarshipsResult = await pool.query(scholarshipQuery, [searchKeyword]);
      scholarships = scholarshipsResult.rows;
    }

    // 2. Query matching organizations (pulling org_pic)
    if (type === 'all' || type === 'organizations') {
      const orgQuery = `
        SELECT id, org_name, sub_email, contact_number, org_pic
        FROM sub_admins 
        WHERE org_name ILIKE $1 AND is_active = TRUE
        LIMIT 5;
      `;
      const orgsResult = await pool.query(orgQuery, [searchKeyword]);
      organizations = orgsResult.rows;
    }

    return res.status(200).json({ scholarships, organizations });
    
  } catch (err) {
    console.error("Global Search Error:", err.message);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};