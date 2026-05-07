export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages, model, max_tokens, temperature } = req.body;
  // Use either the VITE_ prefixed or non-prefixed version from Vercel
  const OPENROUTER_API_KEY = process.env.VITE_OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY;

  if (!OPENROUTER_API_KEY) {
    return res.status(500).json({ error: 'Missing OpenRouter API Key in environment variables' });
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://algoviz.example.com',
        'X-Title': 'AlgoViz AI Training',
      },
      body: JSON.stringify({
        model: model || 'openrouter/auto',
        messages: messages,
        max_tokens: max_tokens || 2048,
        temperature: temperature || 0.7,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }


    return res.status(200).json(data);
  } catch (error) {
    console.error('Error proxying to OpenRouter:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
