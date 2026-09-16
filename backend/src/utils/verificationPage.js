const WEB_URL = (process.env.WEB_URL || 'https://thinktrophy.com').replace(/\/$/, '');
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.thinktrophy.app';
const APP_DEEP_LINK = 'thinktrophy://auth/login?verified=true';

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const LOGO_SVG = `
<svg viewBox="0 0 72 72" width="72" height="72" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <linearGradient id="ttg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0984E3"/>
      <stop offset="100%" stop-color="#00CEC9"/>
    </linearGradient>
  </defs>
  <rect width="72" height="72" rx="18" fill="url(#ttg)"/>
  <path fill="#fff" d="M22 18h28v6c0 8.3-5.4 15.3-13 17.5V48h8v4H27v-4h8V41.5C27.4 39.3 22 32.3 22 24v-6zm4 6c0 6.6 4.5 12.2 10 13.7 5.5-1.5 10-7.1 10-13.7v-2H26v2z"/>
</svg>
`;

function renderVerificationPage(res, { kind, title, message }) {
  const success = kind === 'success';
  const accent = success ? '#10B981' : '#F59E0B';
  const accentSoft = success ? 'rgba(16,185,129,0.16)' : 'rgba(245,158,11,0.16)';
  const heading = escapeHtml(title);
  const body = escapeHtml(message);
  const icon = success
    ? `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="12" fill="${accent}"/><path d="M7 12.5l3.2 3.2L17 8.8" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`
    : `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="12" fill="${accent}"/><path d="M12 7v6M12 17h.01" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/></svg>`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${heading} · ThinkTrophy</title>
  <link rel="icon" href="${WEB_URL}/favicon.png" />
  <style>
    :root { color-scheme: dark; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      min-height: 100vh;
      font-family: Inter, system-ui, -apple-system, Segoe UI, sans-serif;
      background:
        radial-gradient(1200px 500px at 50% -10%, ${accentSoft}, transparent 60%),
        linear-gradient(180deg, #0d1f18 0%, #151D23 45%, #1E272E 100%);
      color: #F5F6FA;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .card {
      width: 100%;
      max-width: 440px;
      background: rgba(35, 47, 56, 0.92);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 24px;
      padding: 36px 28px 28px;
      text-align: center;
      box-shadow: 0 24px 60px rgba(0,0,0,0.35);
    }
    .brand {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin-bottom: 28px;
    }
    .brand img, .brand .mark { width: 48px; height: 48px; border-radius: 12px; display: block; }
    .wordmark { font-size: 20px; font-weight: 800; letter-spacing: -0.02em; }
    .wordmark em { font-style: normal; background: linear-gradient(135deg,#0984E3,#00CEC9); -webkit-background-clip: text; background-clip: text; color: transparent; }
    .badge {
      width: 72px; height: 72px; border-radius: 50%;
      margin: 0 auto 20px;
      display: flex; align-items: center; justify-content: center;
      background: ${accentSoft};
      box-shadow: 0 0 0 10px ${accentSoft};
    }
    h1 { font-size: 26px; font-weight: 800; margin-bottom: 10px; color: ${success ? '#6EE7B7' : '#FDE68A'}; }
    p { color: rgba(245,246,250,0.72); line-height: 1.55; font-size: 15px; }
    .actions { margin-top: 28px; display: flex; flex-direction: column; gap: 10px; }
    a.btn {
      display: block; text-decoration: none; font-weight: 700; font-size: 15px;
      padding: 14px 18px; border-radius: 12px;
    }
    a.primary { background: ${success ? 'linear-gradient(135deg,#059669,#10B981)' : 'linear-gradient(135deg,#0984E3,#00CEC9)'}; color: #fff; }
    a.secondary { background: rgba(255,255,255,0.06); color: #fff; border: 1px solid rgba(255,255,255,0.1); }
    .hint { margin-top: 18px; font-size: 12px; color: rgba(245,246,250,0.4); }
  </style>
</head>
<body>
  <main class="card">
    <div class="brand">
      <img src="${WEB_URL}/favicon.png" alt="ThinkTrophy" onerror="this.style.display='none';document.getElementById('logo-fallback').style.display='block';" />
      <span id="logo-fallback" class="mark" style="display:none">${LOGO_SVG}</span>
      <span class="wordmark">Think<em>Trophy</em></span>
    </div>
    <div class="badge">${icon}</div>
    <h1>${heading}</h1>
    <p>${body}</p>
    <div class="actions">
      ${success ? `<a class="btn primary" href="${APP_DEEP_LINK}">Open ThinkTrophy</a>` : ''}
      <a class="btn ${success ? 'secondary' : 'primary'}" href="${PLAY_STORE_URL}">Download the app</a>
      <a class="btn secondary" href="${WEB_URL}">Go to thinktrophy.com</a>
    </div>
    <p class="hint">You can close this page after opening the app.</p>
  </main>
</body>
</html>`;

  res.status(success ? 200 : 400);
  res.set({
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store',
    'Content-Security-Policy':
      "default-src 'none'; img-src https: data:; style-src 'unsafe-inline'; script-src 'unsafe-inline'",
  });
  return res.send(html);
}

module.exports = { renderVerificationPage, WEB_URL };
