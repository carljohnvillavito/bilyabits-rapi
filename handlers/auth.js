const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('./database');
const config = require('../config.json');

function generateApiKey() {
  const raw = uuidv4().replace(/-/g, '').substring(0, 10);
  const prefix = config.apikey_name;
  return prefix ? `${prefix}-${raw}` : raw;
}

async function registerUser(username, email, password) {
  const hashedPassword = await bcrypt.hash(password, 12);
  const apiKey = generateApiKey();

  const existing = await pool.query(
    'SELECT id FROM users WHERE username = $1 OR email = $2',
    [username, email]
  );
  if (existing.rows.length > 0) {
    throw new Error('Username or email already exists');
  }

  const result = await pool.query(
    'INSERT INTO users (username, email, password, api_key) VALUES ($1, $2, $3, $4) RETURNING id, username, email, api_key',
    [username, email, hashedPassword, apiKey]
  );
  return result.rows[0];
}

async function loginUser(email, password) {
  const result = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );
  if (result.rows.length === 0) {
    throw new Error('Invalid email or password');
  }

  const user = result.rows[0];
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    throw new Error('Invalid email or password');
  }

  await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);
  return { id: user.id, username: user.username, email: user.email, api_key: user.api_key };
}

async function getUserByUsername(username) {
  const result = await pool.query(
    'SELECT id, username, email, api_key, api_calls, created_at, last_login FROM users WHERE username = $1',
    [username]
  );
  return result.rows[0] || null;
}

async function regenerateApiKey(userId) {
  const apiKey = generateApiKey();
  await pool.query('UPDATE users SET api_key = $1 WHERE id = $2', [apiKey, userId]);
  return apiKey;
}

async function validateApiKey(apikey) {
  const result = await pool.query(
    'SELECT id, username FROM users WHERE api_key = $1',
    [apikey]
  );
  return result.rows[0] || null;
}

function requireAuth(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  return res.redirect('/login');
}

function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) {
    return next();
  }
  return res.redirect('/korekong/admin/login');
}

module.exports = {
  registerUser, loginUser, getUserByUsername,
  regenerateApiKey, validateApiKey,
  requireAuth, requireAdmin, generateApiKey
};
