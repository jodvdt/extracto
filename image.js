export const config = { runtime: 'edge' };

export default async function handler(req) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const { searchParams } = new URL(req.url);
  const target = searchParams.get('url');

  if (!target) {
    return new Response(JSON.stringify({ error: 'Missing url param' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  try {
    const response = await fetch(target, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        'Accept-Language': 'en-AU,en;q=0.9',
        'Referer': (() => { try { return new URL(target).origin; } catch(e) { return ''; } })(),
      },
      signal: AbortSignal.timeout(12000),
      redirect: 'follow',
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ error: `Upstream ${response.status}` }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Detect content type — fall back to image/jpeg for extensionless URLs
    let contentType = response.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) {
      // Sniff by URL extension
      const urlLower = target.toLowerCase();
      if (urlLower.includes('.png')) contentType = 'image/png';
      else if (urlLower.includes('.webp')) contentType = 'image/webp';
      else if (urlLower.includes('.gif')) contentType = 'image/gif';
      else contentType = 'image/jpeg'; // safe default for extensionless product images
    }

    const buffer = await response.arrayBuffer();

    // Verify it actually looks like an image (check magic bytes)
    const bytes = new Uint8Array(buffer.slice(0, 4));
    const isJpeg = bytes[0] === 0xFF && bytes[1] === 0xD8;
    const isPng  = bytes[0] === 0x89 && bytes[1] === 0x50;
    const isGif  = bytes[0] === 0x47 && bytes[1] === 0x49;
    const isWebp = bytes[0] === 0x52 && bytes[1] === 0x49;

    if (isJpeg) contentType = 'image/jpeg';
    else if (isPng) contentType = 'image/png';
    else if (isGif) contentType = 'image/gif';
    else if (isWebp) contentType = 'image/webp';

    return new Response(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
        ...corsHeaders,
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}
