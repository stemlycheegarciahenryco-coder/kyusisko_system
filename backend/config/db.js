const { Pool } = require('pg');
require('dotenv').config();

// Determine if we should use Supabase (Production) or Local
const isProduction = !!process.env.SUPABASE_URL;

// Pool tuning: without these, node-pg defaults to max: 10 connections with
// NO connection timeout. Under concurrent load (multiple test machines,
// BullMQ workers sharing this same pool for their own transactions), that
// default can lead to requests silently queueing for a free connection
// instead of failing fast — which shows up as generic "slowness" rather
// than a clear error. connectionTimeoutMillis makes that failure loud
// and immediate instead of an indefinite hang.
const poolTuning = {
  max: parseInt(process.env.DB_POOL_MAX || '20', 10),
  idleTimeoutMillis: 30000,       // close idle clients after 30s
  connectionTimeoutMillis: 5000,  // fail fast instead of hanging if pool is exhausted
};

const pool = isProduction
  ? new Pool({
      connectionString: process.env.SUPABASE_URL,
      ssl: { rejectUnauthorized: false },
      ...poolTuning
    })
  : new Pool({
      user: process.env.DB_USER,
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT || 5432,
      ...poolTuning
    });

// Surface pool-level errors (e.g. a dropped idle connection) instead of
// letting them crash the process silently or go unnoticed.
pool.on('error', (err) => {
  console.error('[Postgres Pool Error]', err.message);
});

const db = {
  query: (text, params) => pool.query(text, params),
  connect: () => pool.connect(),
  end: () => pool.end(),
};

module.exports = db;