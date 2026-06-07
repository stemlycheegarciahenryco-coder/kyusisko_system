const { Pool } = require('pg');
require('dotenv').config();

// Determine if we should use Supabase (Production) or Local
const isProduction = !!process.env.SUPABASE_URL;

const pool = isProduction
  ? new Pool({
      connectionString: process.env.SUPABASE_URL,
      ssl: { rejectUnauthorized: false }
    })
  : new Pool({
      user: process.env.DB_USER,
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT || 5432,
    });

const db = {
  query: (text, params) => pool.query(text, params),
  connect: () => pool.connect(),
  end: () => pool.end(),
};

module.exports = db;