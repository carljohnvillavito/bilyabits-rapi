const { importAsset } = require('../handlers/apiLoader');

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

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OpenRouter API key is not configured');
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'openrouter/pony-alpha',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      stream: false,
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error?.message || `OpenRouter API returned status ${response.status}`);
  }

  const data = await response.json();
  const reply = data.choices?.[0]?.message?.content || 'No response generated';

  return {
    model: data.model || 'openrouter/pony-alpha',
    uid: uid,
    reply: reply,
    usage: data.usage || null,
  };
});
