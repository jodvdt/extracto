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
        'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        'Referer': (() => { try { return new URL(target).origin; } catch(e) { return ''; } })(),
      },
      signal: AbortSignal.timeout(12000),
    });

    if (!response.ok) { res.status(response.status).json({ error: `Upstream ${response.status}` }); return; }

    const buffer = await response.arrayBuffer();
    const bytes = new Uint8Array(buffer.slice(0, 4));

    let contentType = response.headers.get('content-type') || 'image/jpeg';
    if (bytes[0]===0xFF && bytes[1]===0xD8) contentType = 'image/jpeg';
    else if (bytes[0]===0x89 && bytes[1]===0x50) contentType = 'image/png';
    else if (bytes[0]===0x47 && bytes[1]===0x49) contentType = 'image/gif';
    else if (bytes[0]===0x52 && bytes[1]===0x49) contentType = 'image/webp';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.status(200).send(Buffer.from(buffer));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
