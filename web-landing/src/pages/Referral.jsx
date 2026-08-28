import { useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Download } from 'lucide-react';

const ANDROID_PACKAGE = 'com.thinktrophy.app';
const PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`;
const APP_SCHEME = 'thinktrophy';

function normalizeCode(raw) {
  if (!raw) return '';
  return String(raw).trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function playStoreUrlWithReferral(code) {
  if (!code) return PLAY_STORE_URL;
  const referrer = `utm_source=thinktrophy&utm_medium=referral&utm_content=${code}`;
  return `${PLAY_STORE_URL}&referrer=${encodeURIComponent(referrer)}`;
}

function androidIntentUrl(code, playUrl) {
  const path = code ? `auth/register?referral=${encodeURIComponent(code)}` : 'auth/register';
  return `intent://${path}#Intent;scheme=${APP_SCHEME};package=${ANDROID_PACKAGE};S.browser_fallback_url=${encodeURIComponent(playUrl)};end`;
}

export default function Referral() {
  const { code: rawCode } = useParams();
  const code = useMemo(() => normalizeCode(rawCode), [rawCode]);
  const playUrl = useMemo(() => playStoreUrlWithReferral(code), [code]);
  const isAndroid = typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent);

  useEffect(() => {
    document.title = 'Join ThinkTrophy';
    const destination = isAndroid ? androidIntentUrl(code, playUrl) : playUrl;
    const timer = setTimeout(() => {
      window.location.href = destination;
    }, 400);
    return () => clearTimeout(timer);
  }, [code, isAndroid, playUrl]);

  return (
    <div className="min-h-screen flex items-center justify-center py-20 px-4 relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-teal-50/30 to-blue-50/20 dark:from-brand-darker dark:to-brand-dark" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-brand-gradient opacity-5 blur-3xl rounded-full" />
      </div>

      <div className="w-full max-w-lg space-y-6 text-center">
        <img src="/favicon.png" alt="ThinkTrophy" className="w-20 h-20 rounded-3xl mx-auto shadow-xl shadow-brand-blue/20" />
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-black text-brand-dark dark:text-white">
            You're invited
          </h1>
          <p className="text-slate-500 dark:text-white/50">
            Download ThinkTrophy on Google Play. Your referral will be applied automatically when you create an account.
          </p>
        </div>

        <div className="card p-8 space-y-5 shadow-xl dark:shadow-black/20">
          <a
            href={isAndroid ? androidIntentUrl(code, playUrl) : playUrl}
            className="flex items-center justify-center gap-3 p-4 rounded-2xl bg-brand-blue text-white font-bold hover:opacity-90 transition-opacity"
          >
            <Download size={18} />
            Continue to Google Play
          </a>
          <p className="text-xs text-slate-400 dark:text-white/30">
            Opening the Play Store...
          </p>
        </div>

        <Link to="/" className="text-sm text-slate-400 dark:text-white/30 hover:text-brand-blue dark:hover:text-white transition-colors">
          ← Back to home
        </Link>
      </div>
    </div>
  );
}
