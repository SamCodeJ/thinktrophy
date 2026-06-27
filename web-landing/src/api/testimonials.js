import axios from 'axios';

/**
 * Public API base for the marketing site.
 * - Dev / preview: leave VITE_API_URL unset → relative `/api/...` (Vite proxy → backend).
 * - Production: set VITE_API_URL to your API origin, e.g. `https://api.yourdomain.com`
 */
function publicApiUrl(path) {
  const p = path.startsWith('/') ? path : `/${path}`;
  const base = import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? '';
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
  return Array.isArray(list) ? list : [];
}
