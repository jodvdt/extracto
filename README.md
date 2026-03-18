# Extracto

Paste a brief or product links. Get transparent background images or a bundle — no setup required.

## Deploy

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → Import from GitHub
3. Select this repo → Deploy (zero config needed)

Done. Vercel auto-detects the structure.

## How it works

**Image fetching (automatic, in priority order):**
1. Shopify JSON — hits `/products/[handle].json` directly (no proxy, instant)
2. Public CORS proxy — scrapes `og:image` / `twitter:image` from the page
3. Vercel edge function (`/api/proxy.js`) — own proxy fallback for reliability

**Background removal:** Canvas-based, client-side. Works best on product shots with solid or light backgrounds.

## Project structure

```
extracto-app/
├── public/
│   └── index.html      # The full app (single file)
├── api/
│   └── proxy.js        # Vercel edge function — CORS proxy for non-Shopify sites
├── vercel.json         # Routing config
└── README.md
```

## Upgrading background removal

The current BG removal is a corner-sampling pixel remover — fast, works well on white/light backgrounds.

For complex backgrounds, swap in the `@imgly/background-removal` WASM library:
```html
<script type="module">
  import { removeBackground } from 'https://esm.sh/@imgly/background-removal';
  // replaces the removeBg() function in index.html
</script>
```
