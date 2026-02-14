const DB_TYPE = (process.env.DB_TYPE || 'postgresql').toLowerCase();

let pool = null;
let dbClient = null;

function createPgPool(connectionString, forceSSL = false) {
  const { Pool } = require('pg');
  const useSSL = forceSSL || process.env.DB_SSL === 'true' ||
    (connectionString && (connectionString.includes('render.com') || connectionString.includes('neon.tech') || connectionString.includes('supabase')));
  return new Pool({
    connectionString,
    ssl: useSSL ? { rejectUnauthorized: false } : false
  });
}

async function initPgTables(pgPool) {
  const client = await pgPool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        api_key VARCHAR(100) UNIQUE,
        api_calls INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        last_login TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS api_calls_log (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        api_name VARCHAR(100) NOT NULL,
        api_route VARCHAR(255) NOT NULL,
        status_code INTEGER DEFAULT 200,
        response_time_ms INTEGER DEFAULT 0,
        called_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS session (
        sid VARCHAR NOT NULL COLLATE "default",
        sess JSON NOT NULL,
        expire TIMESTAMP(6) NOT NULL,
        PRIMARY KEY (sid)
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_session_expire ON session (expire);
    `);

    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS daily_api_calls INTEGER DEFAULT 0;
    `);
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS daily_reset_at TIMESTAMP DEFAULT NOW();
    `);
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS rate_limited_until TIMESTAMP;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        sender VARCHAR(50) DEFAULT 'Admin',
        target_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        target_all BOOLEAN DEFAULT false,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS notification_reads (
        id SERIAL PRIMARY KEY,
        notification_id INTEGER REFERENCES notifications(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        read_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(notification_id, user_id)
      );
    `);
  } finally {
    client.release();
  }
}

if (DB_TYPE === 'postgresql' || DB_TYPE === 'postgres') {
  const dbUrl = process.env.DATABASE_URL || '';
  if (!dbUrl) {
    console.error('[DB] DATABASE_URL is required for PostgreSQL.');
    console.error('[DB] Set DATABASE_URL in your environment variables.');
    console.error('[DB] Format: postgresql://user:password@host:5432/dbname');
    process.exit(1);
  }
  pool = createPgPool(dbUrl);

  dbClient = {
    type: 'postgresql',
    query: (text, params) => pool.query(text, params),
    connect: () => pool.connect(),
    async initDatabase() {
      await initPgTables(pool);
      console.log('[DB] PostgreSQL tables initialized');
    }
  };

} else if (DB_TYPE === 'supabase') {
  const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || '';

  if (!dbUrl) {
    console.error('');
    console.error('╔══════════════════════════════════════════════════════════════╗');
    console.error('║  Supabase requires your PostgreSQL connection string        ║');
    console.error('╚══════════════════════════════════════════════════════════════╝');
    console.error('');
    console.error('  How to find it:');
    console.error('  1. Go to https://supabase.com/dashboard');
    console.error('  2. Open your project');
    console.error('  3. Go to Project Settings (gear icon) > Database');
    console.error('  4. Under "Connection string", select "URI"');
    console.error('  5. Copy the connection string');
    console.error('  6. Set it as DATABASE_URL in your environment variables');
    console.error('');
    console.error('  Format: postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres');
    console.error('');
    if (process.env.SUPABASE_URL || process.env.SUPABASE_KEY) {
      console.error('  Note: SUPABASE_URL and SUPABASE_KEY alone are not sufficient.');
      console.error('  This app connects directly to Supabase PostgreSQL for full');
      console.error('  SQL support, automatic table creation, and persistent sessions.');
      console.error('  The DATABASE_URL (PostgreSQL connection string) is required.');
      console.error('');
    }
    process.exit(1);
  }

  pool = createPgPool(dbUrl, true);

  dbClient = {
    type: 'supabase',
    query: (text, params) => pool.query(text, params),
    connect: () => pool.connect(),
    async initDatabase() {
      await initPgTables(pool);
      console.log('[DB] Supabase (PostgreSQL) tables initialized');
    }
  };

} else if (DB_TYPE === 'mongodb') {
  console.error('[DB] MongoDB support is not yet implemented.');
  console.error('[DB] To use MongoDB, set DB_TYPE=mongodb and MONGODB_URI in your .env');
  console.error('[DB] This feature is planned for a future release.');
  console.error('[DB] For now, please use DB_TYPE=postgresql or DB_TYPE=supabase.');
  process.exit(1);

} else {
  console.error(`[DB] Unsupported DB_TYPE: "${DB_TYPE}".`);
  console.error('[DB] Supported types: postgresql, supabase');
  console.error('[DB] Coming soon: mongodb');
  process.exit(1);
}

async function initDatabase() {
  await dbClient.initDatabase();
}

module.exports = { pool, dbClient, initDatabase };
