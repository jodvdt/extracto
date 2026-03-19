export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const target = req.query?.url || new URL(req.url, 'http://localhost').searchParams.get('url');
  if (!target) { res.status(400).json({ error: 'Missing url param' }); return; }

  try {
    const response = await fetch(target, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-AU,en;q=0.9',
      },
      signal: AbortSignal.timeout(10000),
    });
    const html = await response.text();
    res.setHeader('Cache-Control', 'public, max-age=600');
    res.status(200).json({ html, status: response.status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
