/**
 * Replace REFERRAL_LINK_BASE with the live HTTPS URL once it is available.
 * Shared links are: `${REFERRAL_LINK_BASE}/{CODE}`
 * Example: 'https://thinktrophy.com/r'
 */
export const REFERRAL_LINK_BASE = 'https://thinktrophy.com/r';

export const PLAY_STORE_PACKAGE = 'com.thinktrophy.app';
export const PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=${PLAY_STORE_PACKAGE}`;
export const APP_SCHEME = 'thinktrophy';

const CODE_RE = /^[A-Z0-9]{4,20}$/;
const IGNORED_REFERRER_VALUES = new Set([
  'GOOGLE-PLAY', 'ORGANIC', 'GOOGLE', 'PLAY', 'REFERRAL', 'THINKTROPHY',
]);

export function buildReferralLink(code) {
  const base = String(REFERRAL_LINK_BASE || '').replace(/\/$/, '');
  const normalized = normalizeReferralCode(code);
  if (!normalized) return base;

  try {
    const url = new URL(base);
    if (url.hostname.includes('play.google.com')) {
      url.searchParams.set(
        'referrer',
        `utm_source=thinktrophy&utm_medium=referral&utm_content=${normalized}`
      );
      return url.toString();
    }
  } catch {
    // Placeholder or non-URL base — append the code as a path segment.
  }

  return `${base}/${normalized}`;
}

export function buildPlayStoreUrl(code) {
  const normalized = normalizeReferralCode(code);
  if (!normalized) return PLAY_STORE_URL;
  return `${PLAY_STORE_URL}&referrer=${encodeURIComponent(
    `utm_source=thinktrophy&utm_medium=referral&utm_content=${normalized}`
  )}`;
}

export function normalizeReferralCode(raw) {
  if (raw == null || raw === '') return null;
  let value = String(raw).trim();
  try {
    value = decodeURIComponent(value);
  } catch {
    // already decoded
  }
  value = value.trim().toUpperCase();
  if (!CODE_RE.test(value) || IGNORED_REFERRER_VALUES.has(value)) return null;
  return value;
}

export function extractReferralCodeFromReferrer(referrer) {
  if (!referrer) return null;
  let value = String(referrer).trim();
  for (let i = 0; i < 2; i++) {
    try {
      const decoded = decodeURIComponent(value);
      if (decoded === value) break;
      value = decoded;
    } catch {
      break;
    }
  }

  const direct = normalizeReferralCode(value);
  if (direct) return direct;

  try {
    const params = new URLSearchParams(value.replace(/^referrer=/i, ''));
    for (const key of ['utm_content', 'referral', 'referral_code', 'ref']) {
      const found = normalizeReferralCode(params.get(key));
      if (found) return found;
    }
  } catch {
    // ignore
  }

  return null;
}

export function extractReferralCodeFromUrl(urlOrPath) {
  if (!urlOrPath) return null;
  const raw = String(urlOrPath).trim();
  if (!raw) return null;

  const withScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(raw)
    ? raw
    : `https://placeholder.invalid/${raw.replace(/^\//, '')}`;

  try {
    const parsed = new URL(withScheme);

    for (const key of ['referral', 'referral_code', 'ref', 'utm_content']) {
      const found = normalizeReferralCode(parsed.searchParams.get(key));
      if (found) return found;
    }

    const fromReferrer = extractReferralCodeFromReferrer(parsed.searchParams.get('referrer'));
    if (fromReferrer) return fromReferrer;

    const parts = [parsed.hostname, ...parsed.pathname.split('/')]
      .filter(Boolean)
      .filter(p => !p.includes('.'));
    const rIndex = parts.findIndex(p => p.toLowerCase() === 'r');
    if (rIndex >= 0 && parts[rIndex + 1]) {
      return normalizeReferralCode(parts[rIndex + 1]);
    }
  } catch {
    return extractReferralCodeFromPath(raw);
  }

  return extractReferralCodeFromPath(raw);
}

export function extractReferralCodeFromPath(path) {
  if (!path) return null;
  const [pathname, search] = String(path).split('?');
  const parts = pathname.split('/').filter(Boolean);
  const rIndex = parts.findIndex(p => p.toLowerCase() === 'r');
  if (rIndex >= 0 && parts[rIndex + 1]) {
    return normalizeReferralCode(parts[rIndex + 1]);
  }
  if (search) {
    try {
      const params = new URLSearchParams(search);
      for (const key of ['referral', 'referral_code', 'ref', 'utm_content']) {
        const found = normalizeReferralCode(params.get(key));
        if (found) return found;
      }
    } catch {
      // ignore
    }
  }
  return null;
}

export function isReferralPath(path) {
  if (!path) return false;
  const pathname = String(path).split('?')[0];
  const parts = pathname.split('/').filter(Boolean);
  return parts.some(p => p.toLowerCase() === 'r');
}

export function referralHttpsPrefix() {
  try {
    const url = new URL(REFERRAL_LINK_BASE);
    if (!url.hostname || url.hostname.toUpperCase().includes('PLACEHOLDER')) return null;
    return `${url.protocol}//${url.host}`;
  } catch {
    return null;
  }
}
