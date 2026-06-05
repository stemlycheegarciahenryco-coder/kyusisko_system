// seed.js
const bcrypt = require('bcryptjs');
const pool = require('./config/db');

const seedSystem = async () => {
    try {
        console.log("⏳ Initializing System Admin Seeding...");

        // Ensure the unique constraint on uid exists so ON CONFLICT handles it safely
        await pool.query(`
            ALTER TABLE users DROP CONSTRAINT IF EXISTS unique_uid;
            ALTER TABLE users ADD CONSTRAINT unique_uid UNIQUE (uid);
        `);

        // Hash your custom test password 'admin123'
        const hashedPw = await bcrypt.hash('admin123', 10);
        
        const res = await pool.query(
            `INSERT INTO users (uid, email, password_hash, role, account_status, first_name, last_name) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) 
             ON CONFLICT (uid) DO UPDATE SET
                email = EXCLUDED.email,
                password_hash = EXCLUDED.password_hash,
                role = EXCLUDED.role,
                account_status = EXCLUDED.account_status,
                first_name = EXCLUDED.first_name,
                last_name = EXCLUDED.last_name
             RETURNING id, uid`,
            [
                'SADM-001',                // 🚀 System Tracking ID (Matched to Front-End rule)
                'yco@kyusisko.ph',         // Admin Contact Email
                hashedPw,                  // Hashed 'admin123'
                'root_admin',              // Master Role privilege key
                'active',                  // Account operational state
                'Yco',                     // Default First Name
                'Garcia'                   // Default Last Name
            ]
        );

        if (res.rows.length > 0) {
            console.log(`✅ Root System Admin Setup Complete!`);
            console.log(`🔑 System ID : ${res.rows[0].uid}`);
            console.log(`🔒 Password  : admin123`);
        } else {
            console.log("⚠️ Seed configuration processed, but no rows returned.");
        }
        process.exit(0);
    } catch (err) {
        console.error("❌ Seeding Error encountered:", err.message);
        process.exit(1);
    }
};

seedSystem();