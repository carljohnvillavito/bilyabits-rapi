const { importAsset } = require('../handlers/apiLoader');

const api = {
  name: 'Test API',
  description: 'A simple test endpoint to verify the API system is working correctly.',
  route: '/test',
  params: {
    'message=': { type: 'string', required: false }
  },
  category: 'General',
  'api-key': false
};

importAsset(api, async (params) => {
  return {
    message: params.message || 'Hello from BILYABITS-RAPI!',
    timestamp: new Date().toISOString()
  };
});
