const DB_TYPE = (process.env.DB_TYPE || 'postgresql').toLowerCase();

let pool = null;
let mongoClient = null;
let mongoDb = null;
let db = {};

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
    await client.query(`CREATE INDEX IF NOT EXISTS idx_session_expire ON session (expire);`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS daily_api_calls INTEGER DEFAULT 0;`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS daily_reset_at TIMESTAMP DEFAULT NOW();`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS rate_limited_until TIMESTAMP;`);
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

function createPgDb(pgPool) {
  return {
    type: DB_TYPE === 'supabase' ? 'supabase' : 'postgresql',

    async initDatabase() {
      await initPgTables(pgPool);
      console.log(`[DB] ${DB_TYPE === 'supabase' ? 'Supabase (PostgreSQL)' : 'PostgreSQL'} tables initialized`);
    },

    async findUserByUsernameOrEmail(username, email) {
      const result = await pgPool.query('SELECT id FROM users WHERE username = $1 OR email = $2', [username, email]);
      return result.rows[0] || null;
    },

    async createUser(username, email, hashedPassword, apiKey) {
      const result = await pgPool.query(
        'INSERT INTO users (username, email, password, api_key) VALUES ($1, $2, $3, $4) RETURNING id, username, email, api_key',
        [username, email, hashedPassword, apiKey]
      );
      return result.rows[0];
    },

    async findUserByEmail(email) {
      const result = await pgPool.query('SELECT * FROM users WHERE email = $1', [email]);
      return result.rows[0] || null;
    },

    async updateLastLogin(userId) {
      await pgPool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [userId]);
    },

    async findUserByUsername(username) {
      const result = await pgPool.query(
        'SELECT id, username, email, api_key, api_calls, created_at, last_login FROM users WHERE username = $1',
        [username]
      );
      return result.rows[0] || null;
    },

    async updateApiKey(userId, apiKey) {
      await pgPool.query('UPDATE users SET api_key = $1 WHERE id = $2', [apiKey, userId]);
    },

    async findUserByApiKey(apiKey) {
      const result = await pgPool.query('SELECT id, username FROM users WHERE api_key = $1', [apiKey]);
      return result.rows[0] || null;
    },

    async getUserRateLimit(userId) {
      const result = await pgPool.query(
        'SELECT daily_api_calls, daily_reset_at, rate_limited_until FROM users WHERE id = $1',
        [userId]
      );
      return result.rows[0] || null;
    },

    async resetDailyLimit(userId) {
      await pgPool.query(
        'UPDATE users SET daily_api_calls = 0, daily_reset_at = NOW(), rate_limited_until = NULL WHERE id = $1',
        [userId]
      );
    },

    async setRateLimit(userId, limitUntil) {
      await pgPool.query('UPDATE users SET rate_limited_until = $1 WHERE id = $2', [limitUntil, userId]);
    },

    async incrementDailyCount(userId) {
      await pgPool.query('UPDATE users SET daily_api_calls = daily_api_calls + 1 WHERE id = $1', [userId]);
    },

    async logApiCall(userId, apiName, apiRoute, statusCode, responseTimeMs) {
      await pgPool.query(
        'INSERT INTO api_calls_log (user_id, api_name, api_route, status_code, response_time_ms) VALUES ($1, $2, $3, $4, $5)',
        [userId, apiName, apiRoute, statusCode, responseTimeMs]
      );
      if (userId) {
        await pgPool.query('UPDATE users SET api_calls = api_calls + 1 WHERE id = $1', [userId]);
      }
    },

    async getTotalApiCalls() {
      const result = await pgPool.query('SELECT COUNT(*) as count FROM api_calls_log');
      return parseInt(result.rows[0].count);
    },

    async getTotalUsers() {
      const result = await pgPool.query('SELECT COUNT(*) as count FROM users');
      return parseInt(result.rows[0].count);
    },

    async getAllUsers() {
      const result = await pgPool.query(
        'SELECT id, username, email, password, api_calls, daily_api_calls, rate_limited_until, created_at FROM users ORDER BY created_at DESC'
      );
      return result.rows;
    },

    async getUserPassword(userId) {
      const result = await pgPool.query('SELECT password FROM users WHERE id = $1', [userId]);
      return result.rows[0]?.password || null;
    },

    async getUserStats(userId) {
      const result = await pgPool.query(
        'SELECT api_calls, daily_api_calls, daily_reset_at, rate_limited_until FROM users WHERE id = $1',
        [userId]
      );
      return result.rows[0] || null;
    },

    async getNotifications(userId) {
      const result = await pgPool.query(`
        SELECT n.id, n.sender, n.title, n.message, n.created_at,
          CASE WHEN nr.id IS NOT NULL THEN true ELSE false END as is_read
        FROM notifications n
        LEFT JOIN notification_reads nr ON nr.notification_id = n.id AND nr.user_id = $1
        WHERE n.target_all = true OR n.target_user_id = $1
        ORDER BY n.created_at DESC
        LIMIT 50
      `, [userId]);
      return result.rows;
    },

    async checkNotificationAccess(notifId, userId) {
      const result = await pgPool.query(
        'SELECT id FROM notifications WHERE id = $1 AND (target_all = true OR target_user_id = $2)',
        [notifId, userId]
      );
      return result.rows.length > 0;
    },

    async markNotificationRead(notifId, userId) {
      await pgPool.query(
        'INSERT INTO notification_reads (notification_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [notifId, userId]
      );
    },

    async markAllNotificationsRead(userId) {
      await pgPool.query(`
        INSERT INTO notification_reads (notification_id, user_id)
        SELECT n.id, $1 FROM notifications n
        LEFT JOIN notification_reads nr ON nr.notification_id = n.id AND nr.user_id = $1
        WHERE (n.target_all = true OR n.target_user_id = $1) AND nr.id IS NULL
      `, [userId]);
    },

    async createNotification(title, message, targetUserId) {
      if (targetUserId) {
        await pgPool.query(
          'INSERT INTO notifications (title, message, target_user_id, target_all) VALUES ($1, $2, $3, false)',
          [title, message, parseInt(targetUserId)]
        );
      } else {
        await pgPool.query(
          'INSERT INTO notifications (title, message, target_all) VALUES ($1, $2, true)',
          [title, message]
        );
      }
    }
  };
}

async function createMongoDb(uri) {
  const { MongoClient } = require('mongodb');
  const client = new MongoClient(uri);
  await client.connect();
  const dbName = new URL(uri).pathname.replace('/', '') || 'bilyabits_rapi';
  const mdb = client.db(dbName);
  mongoClient = client;
  mongoDb = mdb;

  const users = mdb.collection('users');
  const apiCallsLog = mdb.collection('api_calls_log');
  const notifications = mdb.collection('notifications');
  const notificationReads = mdb.collection('notification_reads');

  let counterCol = mdb.collection('counters');

  async function getNextId(name) {
    const result = await counterCol.findOneAndUpdate(
      { _id: name },
      { $inc: { seq: 1 } },
      { upsert: true, returnDocument: 'after' }
    );
    const doc = result.value !== undefined ? result.value : result;
    return doc.seq;
  }

  return {
    type: 'mongodb',

    async initDatabase() {
      await users.createIndex({ username: 1 }, { unique: true });
      await users.createIndex({ email: 1 }, { unique: true });
      await users.createIndex({ api_key: 1 }, { unique: true, sparse: true });
      await apiCallsLog.createIndex({ user_id: 1 });
      await apiCallsLog.createIndex({ called_at: -1 });
      await notifications.createIndex({ target_user_id: 1 });
      await notifications.createIndex({ target_all: 1 });
      await notificationReads.createIndex({ notification_id: 1, user_id: 1 }, { unique: true });

      const counterNames = ['users', 'notifications', 'api_calls_log', 'notification_reads'];
      const collections = { users, notifications, api_calls_log: apiCallsLog, notification_reads: notificationReads };
      for (const name of counterNames) {
        const existing = await counterCol.findOne({ _id: name });
        if (!existing) {
          const col = collections[name];
          const maxDoc = await col.findOne({}, { sort: { id: -1 } });
          await counterCol.updateOne({ _id: name }, { $set: { seq: maxDoc?.id || 0 } }, { upsert: true });
        }
      }

      console.log('[DB] MongoDB collections and indexes initialized');
    },

    async findUserByUsernameOrEmail(username, email) {
      const user = await users.findOne({ $or: [{ username }, { email }] }, { projection: { id: 1 } });
      return user || null;
    },

    async createUser(username, email, hashedPassword, apiKey) {
      const id = await getNextId('users');
      const doc = {
        id,
        username,
        email,
        password: hashedPassword,
        api_key: apiKey,
        api_calls: 0,
        daily_api_calls: 0,
        daily_reset_at: new Date(),
        rate_limited_until: null,
        created_at: new Date(),
        last_login: null
      };
      await users.insertOne(doc);
      return { id: doc.id, username: doc.username, email: doc.email, api_key: doc.api_key };
    },

    async findUserByEmail(email) {
      const user = await users.findOne({ email });
      return user || null;
    },

    async updateLastLogin(userId) {
      await users.updateOne({ id: userId }, { $set: { last_login: new Date() } });
    },

    async findUserByUsername(username) {
      const user = await users.findOne({ username }, {
        projection: { id: 1, username: 1, email: 1, api_key: 1, api_calls: 1, created_at: 1, last_login: 1 }
      });
      return user || null;
    },

    async updateApiKey(userId, apiKey) {
      await users.updateOne({ id: userId }, { $set: { api_key: apiKey } });
    },

    async findUserByApiKey(apiKey) {
      const user = await users.findOne({ api_key: apiKey }, { projection: { id: 1, username: 1 } });
      return user || null;
    },

    async getUserRateLimit(userId) {
      const user = await users.findOne({ id: userId }, {
        projection: { daily_api_calls: 1, daily_reset_at: 1, rate_limited_until: 1 }
      });
      return user || null;
    },

    async resetDailyLimit(userId) {
      await users.updateOne({ id: userId }, {
        $set: { daily_api_calls: 0, daily_reset_at: new Date(), rate_limited_until: null }
      });
    },

    async setRateLimit(userId, limitUntil) {
      await users.updateOne({ id: userId }, { $set: { rate_limited_until: limitUntil } });
    },

    async incrementDailyCount(userId) {
      await users.updateOne({ id: userId }, { $inc: { daily_api_calls: 1 } });
    },

    async logApiCall(userId, apiName, apiRoute, statusCode, responseTimeMs) {
      const id = await getNextId('api_calls_log');
      await apiCallsLog.insertOne({
        id,
        user_id: userId,
        api_name: apiName,
        api_route: apiRoute,
        status_code: statusCode,
        response_time_ms: responseTimeMs,
        called_at: new Date()
      });
      if (userId) {
        await users.updateOne({ id: userId }, { $inc: { api_calls: 1 } });
      }
    },

    async getTotalApiCalls() {
      return await apiCallsLog.countDocuments();
    },

    async getTotalUsers() {
      return await users.countDocuments();
    },

    async getAllUsers() {
      return await users.find({}, {
        projection: { id: 1, username: 1, email: 1, password: 1, api_calls: 1, daily_api_calls: 1, rate_limited_until: 1, created_at: 1 },
        sort: { created_at: -1 }
      }).toArray();
    },

    async getUserPassword(userId) {
      const user = await users.findOne({ id: userId }, { projection: { password: 1 } });
      return user?.password || null;
    },

    async getUserStats(userId) {
      const user = await users.findOne({ id: userId }, {
        projection: { api_calls: 1, daily_api_calls: 1, daily_reset_at: 1, rate_limited_until: 1 }
      });
      return user || null;
    },

    async getNotifications(userId) {
      const notifs = await notifications.find({
        $or: [{ target_all: true }, { target_user_id: userId }]
      }).sort({ created_at: -1 }).limit(50).toArray();

      const readSet = new Set();
      const reads = await notificationReads.find({ user_id: userId }).toArray();
      for (const r of reads) readSet.add(r.notification_id);

      return notifs.map(n => ({
        id: n.id,
        sender: n.sender || 'Admin',
        title: n.title,
        message: n.message,
        created_at: n.created_at,
        is_read: readSet.has(n.id)
      }));
    },

    async checkNotificationAccess(notifId, userId) {
      const n = await notifications.findOne({
        id: parseInt(notifId),
        $or: [{ target_all: true }, { target_user_id: userId }]
      });
      return !!n;
    },

    async markNotificationRead(notifId, userId) {
      await notificationReads.updateOne(
        { notification_id: parseInt(notifId), user_id: userId },
        { $setOnInsert: { id: await getNextId('notification_reads'), read_at: new Date() } },
        { upsert: true }
      );
    },

    async markAllNotificationsRead(userId) {
      const notifs = await notifications.find({
        $or: [{ target_all: true }, { target_user_id: userId }]
      }).toArray();

      for (const n of notifs) {
        await notificationReads.updateOne(
          { notification_id: n.id, user_id: userId },
          { $setOnInsert: { id: await getNextId('notification_reads'), read_at: new Date() } },
          { upsert: true }
        );
      }
    },

    async createNotification(title, message, targetUserId) {
      const id = await getNextId('notifications');
      if (targetUserId) {
        await notifications.insertOne({
          id,
          sender: 'Admin',
          title,
          message,
          target_user_id: parseInt(targetUserId),
          target_all: false,
          created_at: new Date()
        });
      } else {
        await notifications.insertOne({
          id,
          sender: 'Admin',
          title,
          message,
          target_all: true,
          created_at: new Date()
        });
      }
    }
  };
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
  db = createPgDb(pool);

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
  db = createPgDb(pool);

} else if (DB_TYPE === 'mongodb') {
  const mongoUri = process.env.MONGODB_URI || process.env.DATABASE_URL || '';
  if (!mongoUri) {
    console.error('');
    console.error('╔══════════════════════════════════════════════════════════════╗');
    console.error('║  MongoDB requires a connection string (MONGODB_URI)         ║');
    console.error('╚══════════════════════════════════════════════════════════════╝');
    console.error('');
    console.error('  Set MONGODB_URI in your environment variables.');
    console.error('');
    console.error('  MongoDB Atlas (cloud):');
    console.error('    mongodb+srv://user:password@cluster.mongodb.net/dbname');
    console.error('');
    console.error('  Local MongoDB:');
    console.error('    mongodb://localhost:27017/bilyabits_rapi');
    console.error('');
    process.exit(1);
  }

} else {
  console.error(`[DB] Unsupported DB_TYPE: "${DB_TYPE}".`);
  console.error('[DB] Supported types: postgresql, supabase, mongodb');
  process.exit(1);
}

async function initDatabase() {
  if (DB_TYPE === 'mongodb') {
    const mongoUri = process.env.MONGODB_URI || process.env.DATABASE_URL || '';
    db = await createMongoDb(mongoUri);
  }
  await db.initDatabase();
}

function getMongoClient() {
  return mongoClient;
}

function getMongoUri() {
  return process.env.MONGODB_URI || process.env.DATABASE_URL || '';
}

module.exports = { pool, db, initDatabase, getMongoClient, getMongoUri, DB_TYPE };
