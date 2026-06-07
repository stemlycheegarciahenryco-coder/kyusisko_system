const { Pool } = require('pg');
require('dotenv').config();

const localPool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Supabase is paused
const supabasePool = new Pool({
  connectionString: process.env.SUPABASE_URL,
  ssl: { rejectUnauthorized: false }
}); 


const pool = {
  // 1. Keep our custom query logic
  query: async (text, params) => {
    const localRes = await localPool.query(text, params);
    return localRes;
  },

  // 2. ADD THIS: Pass-through for connect
  // This tells the app: "If you need to connect, use the local pool"
  connect: () => localPool.connect(),

  // 3. ADD THIS: Pass-through for closing the pool
  end: () => localPool.end(),
};

module.exports = pool;