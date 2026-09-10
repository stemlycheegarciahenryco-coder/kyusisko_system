// controllers/searchController.js
const pool = require('../config/db');

exports.globalSearch = async (req, res) => {
  try {
    const { q, type = 'all' } = req.query;
    const studentId = req.user?.id;
    
    if (!q || q.trim() === '') {
      return res.status(200).json({ scholarships: [], organizations: [] });
    }

    const searchKeyword = `%${q.trim()}%`;
    let scholarships = [];
    let organizations = [];

    // 1. Query matching active scholarships + student application status
    if (type === 'all' || type === 'scholarships') {
      const scholarshipQuery = `
        SELECT 
          s.id, 
          s.title, 
          s.description, 
          s.criteria, 
          s.deadline,
          s.taken_down,
          sa.id AS org_id,
          sa.org_name,
          sa.org_pic,
          sa.contact_number,
          sa.sub_email,
          sa.website,
          sa.provider_type,
          CONCAT_WS(', ', sa.street_address, sa.barangay, sa.city, sa.region) AS address,
          (
            SELECT COUNT(*)::int 
            FROM applications a 
            WHERE a.scholarship_id = s.id AND a.status IN ('approved', 'active')
          ) AS active_scholars_count,
          (
            SELECT a.id 
            FROM applications a 
            WHERE a.scholarship_id = s.id AND a.student_id = $2
            LIMIT 1
          ) AS existing_application_id
        FROM scholarships s
        LEFT JOIN sub_admins sa ON sa.id = s.sub_admin_id
        WHERE (s.taken_down = FALSE OR s.taken_down IS NULL) 
          AND (s.deadline >= CURRENT_DATE OR s.deadline IS NULL)
          AND (s.title ILIKE $1 OR s.description ILIKE $1 OR sa.org_name ILIKE $1)
        ORDER BY s.created_at DESC
        LIMIT 10;
      `;
      const scholarshipsResult = await pool.query(scholarshipQuery, [searchKeyword, studentId]);
      scholarships = scholarshipsResult.rows;
    }

    // 2. Query matching organizations (Now including cover_pic, about_us, tel_number, created_at)
    if (type === 'all' || type === 'organizations') {
      const orgQuery = `
        SELECT 
          sa.id, 
          sa.org_name, 
          sa.sub_email, 
          sa.contact_number, 
          sa.tel_number,
          sa.org_pic,
          sa.cover_pic,
          sa.about_us,
          sa.website,
          sa.provider_type,
          sa.created_at,
          CONCAT_WS(', ', sa.street_address, sa.barangay, sa.city, sa.region) AS address
        FROM sub_admins sa 
        WHERE (sa.org_name ILIKE $1 OR sa.sub_email ILIKE $1) 
          AND sa.is_active = TRUE
        LIMIT 10;
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

// 3. Fetch public programs for an organization's profile modal
exports.getPublicOrgPrograms = async (req, res) => {
  try {
      const { id } = req.params;

      const result = await pool.query(
          `SELECT 
              s.id, 
              s.title, 
              s.status, 
              s.deadline, 
              s.slots, 
              s.description,
              s.created_at,
              s.show_on_profile,
              COUNT(a.id)::int AS total_applicants,
              COUNT(a.id) FILTER (WHERE a.status IN ('approved', 'active'))::int AS active_scholars
           FROM scholarships s
           LEFT JOIN applications a ON a.scholarship_id = s.id
           WHERE s.sub_admin_id = $1 
             AND s.show_on_profile = true 
             AND (s.taken_down = FALSE OR s.taken_down IS NULL)
           GROUP BY s.id
           ORDER BY s.created_at DESC`,
          [id]
      );
      res.status(200).json({ success: true, data: result.rows });
  } catch (err) {
      console.error("Get Public Org Programs Error:", err.message);
      res.status(500).json({ success: false, message: err.message });
  }
};