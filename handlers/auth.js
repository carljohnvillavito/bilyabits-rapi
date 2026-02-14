const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { db } = require('./database');
const config = require('../config.json');

function generateApiKey() {
  const raw = uuidv4().replace(/-/g, '').substring(0, 10);
  const prefix = config.apikey_name;
  return prefix ? `${prefix}-${raw}` : raw;
}

async function registerUser(username, email, password) {
  const hashedPassword = await bcrypt.hash(password, 12);
  const apiKey = generateApiKey();

  const existing = await db.findUserByUsernameOrEmail(username, email);
  if (existing) {
    throw new Error('Username or email already exists');
  }

  const user = await db.createUser(username, email, hashedPassword, apiKey);
  return user;
}

async function loginUser(email, password) {
  const user = await db.findUserByEmail(email);
  if (!user) {
    throw new Error('Invalid email or password');
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    throw new Error('Invalid email or password');
  }

  await db.updateLastLogin(user.id);
  return { id: user.id, username: user.username, email: user.email, api_key: user.api_key };
}

async function getUserByUsername(username) {
  return await db.findUserByUsername(username);
}

async function regenerateApiKey(userId) {
  const apiKey = generateApiKey();
  await db.updateApiKey(userId, apiKey);
  return apiKey;
}

async function validateApiKey(apikey) {
  return await db.findUserByApiKey(apikey);
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
