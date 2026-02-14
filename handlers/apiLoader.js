const fs = require('fs');
const path = require('path');
const { db } = require('./database');

const loadedAPIs = [];

function importAsset(apiConfig, handler) {
  const rawParams = apiConfig.params || {};
  const normalizedParams = {};
  for (const key of Object.keys(rawParams)) {
    const val = rawParams[key];
    if (val && typeof val === 'object' && val.type) {
      normalizedParams[key] = { type: val.type, required: val.required === true };
    } else {
      normalizedParams[key] = { type: 'string', required: false };
    }
  }

  const api = {
    name: apiConfig.name || 'Unnamed API',
    description: apiConfig.description || '',
    route: apiConfig.route || '/',
    params: normalizedParams,
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
    await db.logApiCall(userId, apiName, apiRoute, statusCode, responseTimeMs);
  } catch (err) {
    console.error('[API] Failed to log call:', err.message);
  }
}

async function getTotalApiCalls() {
  return await db.getTotalApiCalls();
}

async function getTotalUsers() {
  return await db.getTotalUsers();
}

module.exports = {
  importAsset, loadCommands, getAPIs, getAPIsByCategory,
  getStats, logApiCall, getTotalApiCalls, getTotalUsers
};
