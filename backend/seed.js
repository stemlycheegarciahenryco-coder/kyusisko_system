// seed.js
const bcrypt = require('bcryptjs');
const pool = require('./config/db');

const seedSystem = async () => {
    try {
        const hashedPw = await bcrypt.hash('superyco', 10);
        
        const res = await pool.query(
            `INSERT INTO users (email, password_hash, role, uid, account_status) 
             VALUES ($1, $2, $3, $4, $5) 
             ON CONFLICT (email) DO NOTHING RETURNING id`,
            ['super_ycoadmin@kyusisko.sys', hashedPw, 'super_root', 'SR-GLOBAL-001', 'active']
        );

        if (res.rows.length > 0) {
            console.log("👑 System Initialized. Super Root ID:", res.rows[0].id);
        } else {
            console.log("⚠️ Super Root already exists.");
        }
        process.exit();
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};

seedSystem();