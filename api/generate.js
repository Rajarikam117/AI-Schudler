export default async function handler(req, res) {
  try {
    // ✅ ensure POST
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // ✅ safe body parsing
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    if (!body || !body.messages) {
      return res.status(400).json({ error: 'Missing messages' });
    }

    // ✅ check API key
    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ error: 'Missing GROQ_API_KEY' });
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama3-70b-8192",
        messages: body.messages,
        temperature: 0.7
      })
    });

    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return res.status(500).json({
        error: 'Invalid JSON from Groq',
        raw: text
      });
    }

    if (!response.ok) {
      return res.status(400).json(data);
    }

    return res.status(200).json(data);

  } catch (err) {
    return res.status(500).json({
      error: err.message || 'Server crash'
    });
  }
}