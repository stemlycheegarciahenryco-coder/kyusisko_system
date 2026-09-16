const { Pool, types } = require('pg');
require('dotenv').config();

// ─────────────────────────────────────────────────────────────────────────
// Fix: without this, timestamps read back as "8 hours ago"/off-by-8 in the
// UI even though nothing about them is actually stale.
//
// provider_audit_trails.created_at (and every other `timestamp without time
// zone` column) stores a bare "2024-01-01 10:00:00" with no offset — that's
// what `DEFAULT CURRENT_TIMESTAMP` writes, in whatever timezone the DB
// session itself is in (Supabase/Postgres sessions default to UTC). By
// default, node-pg's driver takes that bare string back out and builds a JS
// Date by treating those numbers as if they were already in *this Node
// process's* local timezone (OID 1114 = timestamp without time zone) — not
// UTC. If the Node process's TZ differs from the DB session's timezone (e.g.
// server TZ=Asia/Manila, UTC+8, vs a UTC database), every timestamp silently
// shifts by that offset before your code ever sees it, in the same direction
// every time. That's exactly the fixed ~8-hour gap: it's not frozen, it's
// wrong from the same starting point, so it always looks "8 hours ago" the
// instant a row is created and keeps ticking up correctly from there.
//
// This line forces the driver to treat those bare values as UTC instead of
// guessing from the Node process's local TZ, matching what CURRENT_TIMESTAMP
// actually wrote. Safe as long as the DB session's timezone is UTC — if
// you're not sure, run `SHOW timezone;` against the DB first.
types.setTypeParser(1114, (str) => new Date(str + 'Z'));

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