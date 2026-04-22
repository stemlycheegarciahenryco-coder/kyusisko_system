const bcrypt = require('bcryptjs');
const pool = require('../config/db'); // Double check this path!

exports.createRootAdmin = async (req, res) => {
    const { email, password } = req.body;
    
    // Check if data is arriving
    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Use the exact column names from your 'users' table image
        const query = `
            INSERT INTO users (email, password_hash, role, account_status) 
            VALUES ($1, $2, $3, $4) 
            RETURNING id, email
        `;
        
        const values = [email, hashedPassword, 'root_admin', 'active'];
        
        const result = await pool.query(query, values);

        console.log("✅ Root Admin Created:", result.rows[0]);
        res.status(201).json({ 
            message: "Root Admin created successfully", 
            user: result.rows[0] 
        });

    } catch (err) {
        // THIS LOGS THE REAL ERROR IN YOUR TERMINAL
        console.error("❌ CREATE ROOT ERROR:", err.message);
        
        if (err.code === '23505') { // Unique violation error code
            return res.status(400).json({ error: "This email is already registered as an admin." });
        }
        
        res.status(500).json({ error: "Database error. Check terminal for details." });
    }
};
exports.getAllAdmins = async (req, res) => {
    try {
        // Fetch users who are root_admins (exclude yourself/super_root if you want)
        const result = await pool.query(
            "SELECT id, email, role, account_status, created_at FROM users WHERE role = 'root_admin' ORDER BY created_at DESC"
        );
        
        res.json(result.rows);
    } catch (err) {
        console.error("Fetch Admins Error:", err.message);
        res.status(500).json({ error: "Could not retrieve admin list" });
    }
};

//audit trails
// superController.js
exports.getAuditLogs = async (req, res) => {
    try {
        const query = `
            SELECT 
                a.id, a.action_type, a.details, a.created_at,
                /* Logic: If user_id exists in users, it's an Admin. 
                   If it's in sub_admins, it's an Org/Donor. */
                COALESCE(
                    (SELECT email FROM users WHERE id = a.user_id),
                    (SELECT org_name FROM sub_admins WHERE id = a.user_id),
                    (SELECT sfirst_name || ' ' || slast_name FROM students WHERE id = a.user_id),
                    'System'
                ) as initiator_name,
                COALESCE(
                    (SELECT title FROM scholarships WHERE id::text = substring(a.details from 'ID: (\\d+)')),
                    'System'
                ) as target_display_name
            FROM audit_trails a
            ORDER BY a.created_at DESC
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};



exports.updateAdminStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; 

    try {
        // 1. First, update the user status (We know this works)
        await pool.query(
            'UPDATE users SET account_status = $1 WHERE id = $2',
            [status, id]
        );
        
        // 2. Safely handle the audit log
        // If req.user exists, use its ID. Otherwise, use a placeholder (like 1 or NULL)
        const performingAdminId = req.user ? req.user.id : null; 

        await pool.query(
            'INSERT INTO audit_trails (user_id, action_type, details) VALUES ($1, $2, $3)',
            [
                performingAdminId, 
                `${status.toUpperCase()}_ADMIN`, 
                `Super Root changed Admin (ID: ${id}) status to ${status}`
            ]
        );

        res.json({ message: `Admin ${status} successfully` });

    } catch (err) {
        console.error("❌ BACKEND ERROR:", err.message);
        res.status(500).json({ 
            error: "Internal Server Error", 
            details: err.message 
        });
    }
};



exports.getSystemStats = async (req, res) => {
    try {
        // 1. Count from your 'students' table
        const students = await pool.query("SELECT COUNT(*) FROM students");
        
        // 2. Count from your 'sub_admins' table (which are your Donors/Orgs)
        const orgs = await pool.query("SELECT COUNT(*) FROM sub_admins");
        
        // 3. Count from 'donor_form_fields' (these are your scholarship templates)
        const scholarships = await pool.query("SELECT COUNT(*) FROM form_fields");

        res.json({
            students: parseInt(students.rows[0].count),
            orgs: parseInt(orgs.rows[0].count),
            scholarships: parseInt(scholarships.rows[0].count)
        });
    } catch (err) {
        // This will print the EXACT error in your terminal (e.g., "table does not exist")
        console.error("❌ STATS ERROR:", err.message);
        res.status(500).json({ error: "Database mapping error" });
    }
};

exports.resetAdminPassword = async (req, res) => {
    const { id } = req.params;
    const { password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query(
            'UPDATE users SET password_hash = $1 WHERE id = $2',
            [hashedPassword, id]
        );
        
        res.json({ message: "Password updated successfully" });
    } catch (err) {
        res.status(500).json({ error: "Failed to reset password" });
    }
};