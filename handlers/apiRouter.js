const express = require('express');
const router = express.Router();
const { getAPIs, logApiCall } = require('./apiLoader');
const { validateApiKey } = require('./auth');
const { pool } = require('./database');

const DAILY_LIMIT = 200;
const COOLDOWN_HOURS = 12;

async function checkRateLimit(userId) {
  const result = await pool.query(
    'SELECT daily_api_calls, daily_reset_at, rate_limited_until FROM users WHERE id = $1',
    [userId]
  );
  if (result.rows.length === 0) return { allowed: false, error: 'User not found' };

  const user = result.rows[0];
  const now = new Date();

  if (user.rate_limited_until && new Date(user.rate_limited_until) > now) {
    const remaining = new Date(user.rate_limited_until) - now;
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.ceil((remaining % (1000 * 60 * 60)) / (1000 * 60));
    return {
      allowed: false,
      error: `Rate limit reached (${DAILY_LIMIT} requests/day). You cannot call API tools with required API keys for another ${hours}h ${minutes}m. Please try again later.`,
      remaining,
      limitedUntil: user.rate_limited_until
    };
  }

  if (user.rate_limited_until && new Date(user.rate_limited_until) <= now) {
    await pool.query(
      'UPDATE users SET daily_api_calls = 0, daily_reset_at = NOW(), rate_limited_until = NULL WHERE id = $1',
      [userId]
    );
    return { allowed: true, currentCalls: 0 };
  }

  const resetAt = new Date(user.daily_reset_at);
  const hoursSinceReset = (now - resetAt) / (1000 * 60 * 60);
  if (hoursSinceReset >= 24) {
    await pool.query(
      'UPDATE users SET daily_api_calls = 0, daily_reset_at = NOW(), rate_limited_until = NULL WHERE id = $1',
      [userId]
    );
    return { allowed: true, currentCalls: 0 };
  }

  if (user.daily_api_calls >= DAILY_LIMIT) {
    const limitUntil = new Date(now.getTime() + COOLDOWN_HOURS * 60 * 60 * 1000);
    await pool.query(
      'UPDATE users SET rate_limited_until = $1 WHERE id = $2',
      [limitUntil, userId]
    );
    return {
      allowed: false,
      error: `Rate limit reached (${DAILY_LIMIT} requests/day). You cannot call API tools with required API keys for another ${COOLDOWN_HOURS} hours. Please try again later.`,
      remaining: COOLDOWN_HOURS * 60 * 60 * 1000,
      limitedUntil: limitUntil
    };
  }

  return { allowed: true, currentCalls: user.daily_api_calls };
}

async function incrementDailyCount(userId) {
  await pool.query(
    'UPDATE users SET daily_api_calls = daily_api_calls + 1 WHERE id = $1',
    [userId]
  );
}

function setupApiRoutes() {
  const apis = getAPIs();

  for (const api of apis) {
    const fullRoute = `/${api.category.toLowerCase()}${api.route.toLowerCase()}`;

    router.get(fullRoute, async (req, res) => {
      const startTime = Date.now();
      let userId = null;

      try {
        if (api.requireKey) {
          const apikey = req.query.apikey;
          if (!apikey) {
            return res.status(401).json({
              status: false,
              error: 'API key is required. Pass it as ?apikey=your-key'
            });
          }
          const user = await validateApiKey(apikey);
          if (!user) {
            return res.status(403).json({
              status: false,
              error: 'Invalid API key'
            });
          }
          userId = user.id;

          const rateCheck = await checkRateLimit(userId);
          if (!rateCheck.allowed) {
            return res.status(429).json({
              status: false,
              error: rateCheck.error,
              rate_limit: {
                limit: DAILY_LIMIT,
                remaining: 0,
                reset_at: rateCheck.limitedUntil
              }
            });
          }
        } else {
          const apikey = req.query.apikey;
          if (apikey) {
            const user = await validateApiKey(apikey);
            if (user) userId = user.id;
          }
          if (!userId && req.session && req.session.user) {
            userId = req.session.user.id;
          }
        }

        const params = {};
        for (const key of Object.keys(api.params)) {
          const cleanKey = key.replace('=', '');
          params[cleanKey] = req.query[cleanKey] || null;
        }

        const result = await api.handler(params, req, res);
        const responseTime = Date.now() - startTime;

        if (api.requireKey && userId) {
          await incrementDailyCount(userId);
        }

        if (!res.headersSent) {
          await logApiCall(userId, api.name, fullRoute, 200, responseTime);
          return res.json({
            status: true,
            creator: 'BILYABITS-RAPI',
            result: result
          });
        } else {
          await logApiCall(userId, api.name, fullRoute, 200, responseTime);
        }
      } catch (err) {
        const responseTime = Date.now() - startTime;
        await logApiCall(userId, api.name, fullRoute, 500, responseTime);
        if (!res.headersSent) {
          return res.status(500).json({
            status: false,
            error: err.message || 'Internal server error'
          });
        }
      }
    });
  }

  return router;
}

module.exports = { setupApiRoutes };
