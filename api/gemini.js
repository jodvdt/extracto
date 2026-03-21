export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'GEMINI_API_KEY not configured on server' });
    return;
  }

  try {
    const { model = 'gemini-2.5-flash-image', body } = req.body;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(120000), // 2 min timeout for image gen
      }
    );

    // Always try to parse as JSON
    const text = await geminiRes.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch(e) {
      // Response wasn't JSON -- return it wrapped
      res.status(500).json({ error: `Gemini returned non-JSON: ${text.slice(0, 200)}` });
      return;
    }

    if (!geminiRes.ok) {
      res.status(geminiRes.status).json({ error: data.error?.message || `Gemini error ${geminiRes.status}` });
      return;
    }

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
