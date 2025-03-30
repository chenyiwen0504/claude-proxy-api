export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle OPTIONS request (preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method not allowed' } });
  }

  try {
    const { apiKey, model, messages, system, temperature, maxTokens } = req.body;

    if (!apiKey) {
      return res.status(400).json({ error: { message: 'API key is required' } });
    }

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: { message: 'Messages array is required' } });
    }

    // Call Anthropic API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: model || 'claude-3-5-haiku-20240307',
        messages: messages,
        system: system || '',
        max_tokens: maxTokens || 4000,
        temperature: temperature || 0.7
      })
    });

    // Get the response data
    const data = await response.json();

    // Handle errors from Anthropic
    if (!response.ok) {
      return res.status(response.status).json({ 
        error: data.error || { message: 'Error from Anthropic API' } 
      });
    }

    // Return the successful response
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error in Claude proxy API:', error);
    
    // Return a generic error response
    return res.status(500).json({
      error: {
        message: error.message || 'Internal server error',
        type: 'internal_server_error'
      }
    });
  }
}
