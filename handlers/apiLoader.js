const fs = require('fs');
const path = require('path');
const { pool } = require('./database');

const loadedAPIs = [];

function importAsset(apiConfig, handler) {
  const api = {
    name: apiConfig.name || 'Unnamed API',
    description: apiConfig.description || '',
    route: apiConfig.route || '/',
    params: apiConfig.params || {},
    category: apiConfig.category || 'General',
    requireKey: apiConfig['api-key'] !== undefined ? apiConfig['api-key'] : true,
    handler: handler,
    alive: true
  };
  loadedAPIs.push(api);
  return api;
}

function loadCommands() {
  const commandsDir = path.join(__dirname, '..', 'commands');
  if (!fs.existsSync(commandsDir)) {
    fs.mkdirSync(commandsDir, { recursive: true });
    return;
  }

  const files = fs.readdirSync(commandsDir).filter(f => f.endsWith('.js'));
  for (const file of files) {
    try {
      require(path.join(commandsDir, file));
      console.log(`[API] Loaded: ${file}`);
    } catch (err) {
      console.error(`[API] Failed to load ${file}:`, err.message);
    }
  }
}

function getAPIs() {
  return loadedAPIs;
}

function getAPIsByCategory() {
  const categories = {};
  for (const api of loadedAPIs) {
    if (!categories[api.category]) {
      categories[api.category] = [];
    }
    categories[api.category].push(api);
  }
  return categories;
}

function getStats() {
  return {
    totalAPIs: loadedAPIs.length,
    deadAPIs: loadedAPIs.filter(a => !a.alive).length,
    categories: Object.keys(getAPIsByCategory())
  };
}

async function logApiCall(userId, apiName, apiRoute, statusCode, responseTimeMs) {
  try {
    await pool.query(
      'INSERT INTO api_calls_log (user_id, api_name, api_route, status_code, response_time_ms) VALUES ($1, $2, $3, $4, $5)',
      [userId, apiName, apiRoute, statusCode, responseTimeMs]
    );
    if (userId) {
      await pool.query('UPDATE users SET api_calls = api_calls + 1 WHERE id = $1', [userId]);
    }
  } catch (err) {
    console.error('[API] Failed to log call:', err.message);
  }
}

async function getTotalApiCalls() {
  const result = await pool.query('SELECT COUNT(*) as count FROM api_calls_log');
  return parseInt(result.rows[0].count);
}

async function getTotalUsers() {
  const result = await pool.query('SELECT COUNT(*) as count FROM users');
  return parseInt(result.rows[0].count);
}

module.exports = {
  importAsset, loadCommands, getAPIs, getAPIsByCategory,
  getStats, logApiCall, getTotalApiCalls, getTotalUsers
};
