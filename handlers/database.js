const DB_TYPE = (process.env.DB_TYPE || 'postgresql').toLowerCase();

let pool = null;
let dbClient = null;

if (DB_TYPE === 'postgresql' || DB_TYPE === 'postgres') {
  const { Pool } = require('pg');
  const dbUrl = process.env.DATABASE_URL || '';
  const useSSL = process.env.DB_SSL === 'true' || (dbUrl.includes('render.com') || dbUrl.includes('neon.tech') || dbUrl.includes('supabase'));
  pool = new Pool({
    connectionString: dbUrl,
    ssl: useSSL ? { rejectUnauthorized: false } : false
  });

  dbClient = {
    type: 'postgresql',
    query: (text, params) => pool.query(text, params),
    connect: () => pool.connect(),

    async initDatabase() {
      const client = await pool.connect();
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

        console.log('[DB] PostgreSQL tables initialized');
      } finally {
        client.release();
      }
    }
  };
} else if (DB_TYPE === 'mongodb') {
  console.error('[DB] MongoDB support is not yet implemented.');
  console.error('[DB] To use MongoDB, set DB_TYPE=mongodb and MONGODB_URI in your .env');
  console.error('[DB] This feature is planned for a future release.');
  process.exit(1);
} else if (DB_TYPE === 'supabase') {
  console.error('[DB] Supabase support is not yet implemented.');
  console.error('[DB] To use Supabase, set DB_TYPE=supabase, SUPABASE_URL and SUPABASE_KEY in your .env');
  console.error('[DB] This feature is planned for a future release.');
  process.exit(1);
} else {
  console.error(`[DB] Unsupported DB_TYPE: "${DB_TYPE}". Supported: postgresql (mongodb and supabase coming soon)`);
  process.exit(1);
}

async function initDatabase() {
  await dbClient.initDatabase();
}

module.exports = { pool, dbClient, initDatabase };
