import { useLocation, Link } from 'react-router-dom';
import { Trophy, CheckCircle2, ArrowRight, Star } from 'lucide-react';

const APP_STORE_URL  = '#';  // replace when live
const PLAY_STORE_URL = '#';  // replace when live

const steps = [
  { icon: '📲', text: 'Download the app from the App Store or Google Play' },
  { icon: '🔑', text: 'Log in using your username or email and the password you just created' },
  { icon: '💰', text: 'Fund your wallet with any amount from ₦500' },
  { icon: '🏆', text: 'Pick 7 categories, stake your amount, and start playing!' },
];

export default function Download() {
  const { state } = useLocation();
  const fromSignup = state?.fromSignup;
  const username   = state?.username;

  return (
    <div className="min-h-screen flex items-center justify-center py-20 px-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-teal-50/30 to-blue-50/20 dark:from-brand-darker dark:to-brand-dark" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-brand-gradient opacity-5 blur-3xl rounded-full" />
      </div>

      <div className="w-full max-w-lg space-y-6">

        {/* Success header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mx-auto shadow-2xl shadow-brand-blue/30">
            {fromSignup ? (
              <CheckCircle2 size={36} className="text-white" />
            ) : (
              <img src="/favicon.png" alt="ThinkTrophy" className="w-20 h-20 rounded-3xl" />
            )}
          </div>

          {fromSignup ? (
            <>
              <h1 className="text-3xl sm:text-4xl font-black text-brand-dark dark:text-white">
                Welcome{username ? `, ${username}` : ''}! 🎉
              </h1>
              <p className="text-slate-500 dark:text-white/50">
                Your account is ready. Download the app to start playing and winning!
              </p>
            </>
          ) : (
            <>
              <h1 className="text-3xl sm:text-4xl font-black text-brand-dark dark:text-white">
                Get the App
              </h1>
              <p className="text-slate-500 dark:text-white/50">
                ThinkTrophy is available on iOS and Android. Download now and start winning!
              </p>
            </>
          )}
        </div>

        {/* Download buttons */}
        <div className="card p-8 space-y-5 shadow-xl dark:shadow-black/20">
          <p className="text-center text-sm font-semibold text-slate-500 dark:text-white/40 uppercase tracking-wider">
            Available on
          </p>

          <div className="space-y-3">
            {/* App Store */}
            <a
              href={APP_STORE_URL}
              className="flex items-center gap-4 p-4 rounded-2xl border-2 border-brand-blue/20 hover:border-brand-blue hover:bg-brand-blue/5 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-black flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-xs text-slate-400 dark:text-white/40">Download on the</p>
                <p className="text-lg font-bold text-brand-dark dark:text-white">App Store</p>
                <p className="text-xs text-slate-400 dark:text-white/30">iOS 14.0 or later</p>
              </div>
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={12} className="text-yellow-400 fill-yellow-400" />
                ))}
              </div>
            </a>

            {/* Google Play */}
            <a
              href={PLAY_STORE_URL}
              className="flex items-center gap-4 p-4 rounded-2xl border-2 border-brand-teal/20 hover:border-brand-teal hover:bg-brand-teal/5 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-white dark:bg-white/10 border border-slate-100 dark:border-white/10 flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none">
                  <path d="M3.18 23.5c.4.22.87.22 1.28-.02l11.9-6.84-2.57-2.6L3.18 23.5z" fill="#EA4335"/>
                  <path d="M20.82 9.93L17.7 8.14l-2.91 2.9 2.91 2.93 3.14-1.8c.9-.52.9-1.72-.02-2.24z" fill="#FBBC04"/>
                  <path d="M3.18.5C2.8.72 2.5 1.16 2.5 1.72v20.56c0 .56.3 1 .68 1.22l10.61-11.5L3.18.5z" fill="#4285F4"/>
                  <path d="M14.79 12L3.18.5 4.46.5l11.24 8.64L14.79 12z" fill="#34A853"/>
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-xs text-slate-400 dark:text-white/40">Get it on</p>
                <p className="text-lg font-bold text-brand-dark dark:text-white">Google Play</p>
                <p className="text-xs text-slate-400 dark:text-white/30">Android 8.0 or later</p>
              </div>
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={12} className="text-yellow-400 fill-yellow-400" />
                ))}
              </div>
            </a>
          </div>

          <p className="text-center text-xs text-slate-400 dark:text-white/25 pt-1">
            ⏳ App links coming soon — check back shortly after launch
          </p>
        </div>

        {/* Next steps */}
        <div className="card p-6 space-y-4">
          <h3 className="font-bold text-brand-dark dark:text-white flex items-center gap-2">
            <ArrowRight size={16} className="text-brand-blue" />
            What to do next
          </h3>
          <div className="space-y-3">
            {steps.map(({ icon, text }, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-lg flex-shrink-0 leading-none mt-0.5">{icon}</span>
                <p className="text-sm text-slate-600 dark:text-white/60 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Back to home */}
        <div className="text-center">
          <Link to="/" className="text-sm text-slate-400 dark:text-white/30 hover:text-brand-blue dark:hover:text-white transition-colors">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
