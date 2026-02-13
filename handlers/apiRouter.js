const express = require('express');
const router = express.Router();
const { getAPIs, logApiCall } = require('./apiLoader');
const { validateApiKey } = require('./auth');

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
        }

        const params = {};
        for (const key of Object.keys(api.params)) {
          const cleanKey = key.replace('=', '');
          params[cleanKey] = req.query[cleanKey] || null;
        }

        const result = await api.handler(params, req, res);

        if (!res.headersSent) {
          const responseTime = Date.now() - startTime;
          await logApiCall(userId, api.name, fullRoute, 200, responseTime);
          return res.json({
            status: true,
            creator: 'BILYABITS-RAPI',
            result: result
          });
        } else {
          const responseTime = Date.now() - startTime;
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
