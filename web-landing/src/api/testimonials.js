import axios from 'axios';

/**
 * Public API base for the marketing site.
 * - Dev / preview: leave VITE_API_URL unset → relative `/api/...` (Vite proxy → backend).
 * - Production build: defaults to PRODUCTION_API (the site is static, so a relative `/api/...`
 *   would just return the site's own index.html). Override with VITE_API_URL if needed.
 * - To force relative URLs in a production-mode build (e.g. `vite preview` behind the proxy),
 *   set VITE_API_URL to an empty string.
 */
const PRODUCTION_API = 'https://api.thinktrophy.com';

function publicApiUrl(path) {
  const p = path.startsWith('/') ? path : `/${path}`;
  const envBase = import.meta.env.VITE_API_URL?.replace(/\/$/, '');
  const base = envBase ?? (import.meta.env.PROD ? PRODUCTION_API : '');
  if (base) return `${base}${p}`;
  return p;
}

const client = axios.create({
  headers: { 'Content-Type': 'application/json' },
});

/** Public list for the marketing site (no auth). */
export async function fetchPublicTestimonials() {
  const { data } = await client.get(publicApiUrl('/api/app/testimonials'));
  const list = data?.data;
  // A non-JSON reply (e.g. the site's own index.html) must surface as an error, not as "no reviews".
  if (!Array.isArray(list)) throw new Error('Unexpected testimonials response');
  return list;
}
