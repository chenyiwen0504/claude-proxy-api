export default async function handler(req, res) {
  console.log('Received request:', {
    method: req.method,
    headers: req.headers,
    url: req.url
  });

  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', 'http://127.0.0.1:5500');  // Allow localhost
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-api-key, anthropic-version');

  // Handle OPTIONS request (preflight)
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    console.log('Method not allowed:', req.method);
    return res.status(405).json({ error: { message: 'Method not allowed' } });
  }

  try {
    console.log('Processing POST request');
    const { apiKey, model, messages, system, temperature, maxTokens } = req.body;
    console.log('Request body:', {
      model,
      messagesLength: messages?.length,
      hasSystem: !!system,
      temperature,
      maxTokens
    });

    if (!apiKey) {
      console.log('Missing API key');
      return res.status(400).json({ error: { message: 'API key is required' } });
    }

    if (!messages || !Array.isArray(messages)) {
      console.log('Invalid messages:', messages);
      return res.status(400).json({ error: { message: 'Messages array is required' } });
    }

    console.log('Making request to Anthropic API');
    // Call Anthropic API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: model || 'claude-3-haiku-20240307',
        messages: messages,
        system: system,
        max_tokens: maxTokens || 4000,
        temperature: temperature || 0.7
      })
    });

    console.log('Anthropic API response status:', response.status);
    const data = await response.json();

    if (!response.ok) {
      console.log('Anthropic API error:', data);
      return res.status(response.status).json({ 
        error: data.error || { message: 'Error from Anthropic API' } 
      });
    }

    console.log('Successful response');
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
