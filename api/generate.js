export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const body = typeof req.body === 'string'
      ? JSON.parse(req.body)
      : req.body;

    if (!body || !body.messages) {
      return res.status(400).json({ error: 'Missing messages' });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ error: 'Missing GROQ_API_KEY' });
    }

    // ✅ timeout safety (important)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama3-70b-8192",
        messages: body.messages,
        temperature: 0.7,
        max_tokens: 1200   // ✅ added
      })
    });

    clearTimeout(timeout);

    const text = await response.text();
    console.log("GROQ RAW:", text); // ✅ debug log

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
      return res.status(400).json({
        error: data.error || "Groq API error",
        raw: data
      });
    }

    return res.status(200).json(data);

  } catch (err) {
    console.error("SERVER ERROR:", err);

    return res.status(500).json({
      error: err.name === 'AbortError'
        ? 'Request timeout'
        : err.message || 'Server crash'
    });
  }
}