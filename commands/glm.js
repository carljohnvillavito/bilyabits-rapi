const { importAsset } = require('../handlers/apiLoader');
const axios = require('axios');

const API_KEY = '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';
const MODEL = 'openrouter/pony-alpha';

const api = {
  name: 'GLM AI Chat',
  description: 'Chat with an AI assistant powered by GLM. Provide a question and optional system prompt.',
  route: '/glm',
  params: {
    'q=': String,
    'system=': String,
    'uid=': String
  },
  category: 'AI',
  'api-key': true
};

importAsset(api, async (params) => {
  const userPrompt = params.q;
  const systemPrompt = params.system || 'You are a powerful AI Assistant';
  const uid = params.uid || 'anonymous';

  if (!userPrompt) {
    throw new Error('Parameter "q" is required. Usage: ?q=your+message');
  }

  const { data } = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
    model: MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    stream: false,
  }, {
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  const reply = data.choices?.[0]?.message?.content || 'No response generated';

  return {
    model: data.model || MODEL,
    uid: uid,
    reply: reply,
    usage: data.usage || null,
  };
});
