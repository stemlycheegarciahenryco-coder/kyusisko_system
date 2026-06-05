const express = require('express');
const router = express.Router();
const pool = require('../config/db'); // Adjust path to your db pool configuration

// GET /api/lookup/colleges
router.get('/colleges', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, name FROM colleges ORDER BY name ASC');
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching colleges lookup:", err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// GET /api/lookup/courses
router.get('/courses', async (req, res) => {
    try {
        // Removed college_id to prevent database selection failures
        const result = await pool.query('SELECT id, name FROM courses ORDER BY name ASC');
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching courses lookup:", err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;