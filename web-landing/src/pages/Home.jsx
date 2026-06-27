import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Trophy, Download, Zap, Shield, Users, Star,
  ChevronRight, Check, BookOpen, Brain, Globe2,
  Cpu, Music, FlaskConical, Landmark, Heart,
  ArrowRight, Smartphone, Play, Quote,
} from 'lucide-react';
import { fetchPublicTestimonials } from '../api/testimonials';

/* ─── Data ─────────────────────────────────────────────────────────────── */

const stats = [
  { value: '130k+', label: 'Questions' },
  { value: '25+',      label: 'Categories' },
  { value: '50,000+', label: 'Players' },
  { value: '₦500',   label: 'Min Stake' },
];

const features = [
  {
    icon: Brain,
    title: 'Test Your Knowledge',
    desc: 'Thousands of expertly crafted questions across science, history, culture, tech, and more.',
    color: 'text-brand-blue bg-brand-blue/10 dark:bg-brand-blue/15',
  },
  {
    icon: Zap,
    title: 'Fast-Paced Gameplay',
    desc: 'Answer 10 questions in 60 seconds. Every second counts — speed and accuracy matter.',
    color: 'text-yellow-500 bg-yellow-500/10 dark:bg-yellow-500/15',
  },
  {
    icon: Trophy,
    title: 'Win Real Prizes',
    desc: 'Score 9 or 10 out of 10 to earn a cash payout. The sharper your mind, the bigger your reward.',
    color: 'text-brand-teal bg-brand-teal/10 dark:bg-brand-teal/15',
  },
  {
    icon: Shield,
    title: 'Fair & Secure',
    desc: 'Every game is monitored for fair play. Your wallet and data are protected with bank-grade security.',
    color: 'text-green-500 bg-green-500/10 dark:bg-green-500/15',
  },
  {
    icon: Users,
    title: 'Compete Globally',
    desc: 'Join thousands of players from around the world and climb the leaderboard rankings.',
    color: 'text-purple-500 bg-purple-500/10 dark:bg-purple-500/15',
  },
  {
    icon: Globe2,
    title: 'Play Anywhere',
    desc: 'Available on iOS and Android. Play during your commute, lunch break, or whenever inspiration strikes.',
    color: 'text-orange-500 bg-orange-500/10 dark:bg-orange-500/15',
  },
];

const steps = [
  {
    step: '01',
    title: 'Create Your Account',
    desc: 'Sign up in seconds with your email. No credit card required to get started.',
    cta: { label: 'Sign Up Now', href: '/signup' },
  },
  {
    step: '02',
    title: 'Fund Your Wallet',
    desc: 'Deposit any amount from ₦500. Funds are held securely until your game completes.',
    cta: null,
  },
  {
    step: '03',
    title: 'Pick a Category & Play',
    desc: 'Choose your topic, stake your amount, and answer 10 questions in 60 seconds as fast and accurately as you can.',
    cta: null,
  },
  {
    step: '04',
    title: 'Win & Withdraw',
    desc: 'Score 9/10 or 10/10 to earn your payout. Withdraw your winnings instantly to your account.',
    cta: null,
  },
];

const categories = [
  { icon: FlaskConical, name: 'Science',   color: 'text-blue-500'  },
  { icon: Landmark,     name: 'History',   color: 'text-amber-500' },
  { icon: Cpu,          name: 'Tech',      color: 'text-cyan-500'  },
  { icon: Globe2,       name: 'Geography', color: 'text-green-500' },
  { icon: Music,        name: 'Music',     color: 'text-pink-500'  },
  { icon: BookOpen,     name: 'Literature',color: 'text-purple-500'},
  { icon: Heart,        name: 'Health',    color: 'text-red-500'   },
  { icon: Brain,        name: 'General',   color: 'text-indigo-500'},
];

const APP_STORE_URL    = '#';  // replace when live
const PLAY_STORE_URL   = '#';  // replace when live

/* ─── Section components ────────────────────────────────────────────────── */

function SectionLabel({ children }) {
  return (
    <span className="badge mb-4 inline-flex">
      {children}
    </span>
  );
}

/* ─── Page ──────────────────────────────────────────────────────────────── */

function TestimonialStars({ value }) {
  if (value == null || value < 1) return null;
  return (
    <div className="flex gap-0.5 mt-3">
      {Array.from({ length: value }, (_, i) => (
        <Star key={i} size={14} className="text-yellow-400 fill-yellow-400" />
      ))}
    </div>
  );
}

export default function Home() {
  const [testimonials, setTestimonials] = useState([]);
  const [testimonialsLoading, setTestimonialsLoading] = useState(true);
  const [testimonialsError, setTestimonialsError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setTestimonialsError(false);
    fetchPublicTestimonials()
      .then(rows => {
        if (!cancelled) setTestimonials(Array.isArray(rows) ? rows : []);
      })
      .catch(() => {
        if (!cancelled) {
          setTestimonials([]);
          setTestimonialsError(true);
        }
      })
      .finally(() => {
        if (!cancelled) setTestimonialsLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section id="home" className="relative min-h-screen flex items-center overflow-hidden pt-16">
        {/* Background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/40 to-teal-50/30 dark:from-brand-darker dark:via-brand-darker dark:to-brand-dark" />
          <div className="absolute top-20 right-0 w-[600px] h-[600px] bg-brand-blue/8 dark:bg-brand-blue/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-brand-teal/8 dark:bg-brand-teal/5 rounded-full blur-3xl" />
        </div>

        <div className="section w-full py-20">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            {/* Left — copy */}
            <div className="space-y-7 animate-fade-up">
              <SectionLabel><Zap size={12} /> Now available on iOS & Android</SectionLabel>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight text-brand-dark dark:text-white">
                Think<br />
                Sharp.<br />
                <span className="gradient-text">Win Big.</span>
              </h1>

              <p className="text-lg text-slate-600 dark:text-white/60 max-w-md leading-relaxed">
                The ultimate knowledge challenge platform. Answer 10 questions in 60 seconds, beat the clock, and walk away with real cash prizes.
              </p>

              <div className="flex flex-wrap gap-3 pt-1">
                <Link to="/signup" className="btn-primary text-base px-7 py-3.5">
                  Create Free Account <ArrowRight size={18} />
                </Link>
                <a href="#download" className="btn-secondary text-base px-7 py-3.5">
                  <Download size={18} /> Get the App
                </a>
              </div>

              <div className="flex items-center gap-5 pt-2">
                {['130k+ Questions', 'Real Cash Prizes', 'Fair Play Guaranteed'].map(item => (
                  <div key={item} className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-white/40">
                    <Check size={14} className="text-brand-teal flex-shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Right — visual */}
            <div className="flex justify-center lg:justify-end">
              <div className="relative w-72 sm:w-80">
                {/* Phone shell */}
                <div className="relative mx-auto w-64 h-[500px] rounded-[3rem] border-4 border-slate-200 dark:border-white/10 bg-white dark:bg-brand-card shadow-2xl shadow-brand-blue/10 overflow-hidden animate-float">
                  {/* Screen content */}
                  <div className="absolute inset-0 bg-brand-gradient opacity-10 dark:opacity-5" />
                  <div className="p-5 space-y-4 pt-10">
                    {/* Question card */}
                    <div className="bg-brand-gradient rounded-2xl p-4 text-white shadow-lg">
                      <p className="text-xs font-semibold opacity-80 mb-1">Science • Hard</p>
                      <p className="text-sm font-bold leading-snug">What is the chemical symbol for Gold?</p>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 bg-white/20 h-1 rounded-full">
                          <div className="bg-white h-1 rounded-full w-3/4" />
                        </div>
                        <span className="text-xs font-semibold">45s</span>
                      </div>
                    </div>

                    {/* Options */}
                    {[['A', 'Go'], ['B', 'Ag'], ['C', 'Au', true], ['D', 'Fe']].map(([letter, text, correct]) => (
                      <div key={letter} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${correct ? 'bg-green-50 dark:bg-green-500/15 border-green-300 dark:border-green-500/30' : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/5'}`}>
                        <span className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center flex-shrink-0 ${correct ? 'bg-green-500 text-white' : 'bg-brand-gradient text-white'}`}>{letter}</span>
                        <span className={`text-sm font-medium ${correct ? 'text-green-700 dark:text-green-400' : 'text-slate-700 dark:text-white/80'}`}>{text}</span>
                        {correct && <Check size={14} className="ml-auto text-green-500" />}
                      </div>
                    ))}

                    {/* Score strip */}
                    <div className="flex items-center justify-between bg-slate-50 dark:bg-white/5 rounded-xl p-3">
                      <div className="text-center">
                        <p className="text-xs text-slate-400 dark:text-white/30">Score</p>
                        <p className="text-lg font-black text-brand-blue">8/10</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-slate-400 dark:text-white/30">Payout</p>
                        <p className="text-lg font-black text-green-500">₦0.00</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-slate-400 dark:text-white/30">Streak</p>
                        <p className="text-lg font-black text-yellow-500">🔥 3</p>
                      </div>
                    </div>
                  </div>
                  {/* Home bar */}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-20 h-1 bg-slate-300 dark:bg-white/20 rounded-full" />
                </div>

                {/* Floating badges */}
                <div className="absolute -left-6 top-20 bg-white dark:bg-brand-card rounded-2xl px-4 py-2.5 shadow-xl border border-slate-100 dark:border-white/10 animate-float-slow">
                  <div className="flex items-center gap-2">
                    <Star size={14} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-xs font-semibold text-slate-700 dark:text-white">10/10 Perfect!</span>
                  </div>
                </div>

                <div className="absolute -right-4 bottom-28 bg-white dark:bg-brand-card rounded-2xl px-4 py-2.5 shadow-xl border border-slate-100 dark:border-white/10 animate-float">
                  <div className="flex items-center gap-2">
                    <img src="/favicon.png" alt="ThinkTrophy" className="w-3.5 h-3.5 rounded-sm" />
                    <span className="text-xs font-semibold text-slate-700 dark:text-white">+₦2,500 Won!</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────────────────────────── */}
      <section className="py-12 bg-brand-gradient">
        <div className="section">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center text-white">
            {stats.map(({ value, label }) => (
              <div key={label}>
                <p className="text-4xl font-black">{value}</p>
                <p className="text-sm font-medium opacity-80 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section id="features" className="py-24">
        <div className="section">
          <div className="text-center mb-14">
            <SectionLabel><Zap size={12} /> Why ThinkTrophy</SectionLabel>
            <h2 className="text-4xl sm:text-5xl font-black text-brand-dark dark:text-white mt-2">
              Everything you need to<br />
              <span className="gradient-text">play and win</span>
            </h2>
            <p className="text-slate-500 dark:text-white/50 mt-4 max-w-xl mx-auto">
              Built for curious minds who want more than just a quiz — a real challenge with real rewards.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="card p-6 hover:shadow-md dark:hover:border-white/10 transition-all duration-200 group">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${color}`}>
                  {title === 'Win Real Prizes' ? (
                    <img src="/favicon.png" alt="ThinkTrophy" className="w-6 h-6 rounded-md" />
                  ) : (
                    <Icon size={22} />
                  )}
                </div>
                <h3 className="font-bold text-lg text-brand-dark dark:text-white mb-2">{title}</h3>
                <p className="text-sm text-slate-500 dark:text-white/50 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Categories ───────────────────────────────────────────────────── */}
      <section className="py-20 bg-slate-50/80 dark:bg-brand-dark/40">
        <div className="section">
          <div className="text-center mb-12">
            <SectionLabel><BookOpen size={12} /> Categories</SectionLabel>
            <h2 className="text-4xl font-black text-brand-dark dark:text-white mt-2">
              What do you know best?
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {categories.map(({ icon: Icon, name, color }) => (
              <div key={name} className="card p-5 flex flex-col items-center gap-3 hover:shadow-md transition-all cursor-default group">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-slate-100 dark:bg-white/5 group-hover:scale-110 transition-transform ${color}`}>
                  <Icon size={22} />
                </div>
                <span className="text-sm font-semibold text-brand-dark dark:text-white/80">{name}</span>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-slate-400 dark:text-white/30 mt-6">
            More categories added regularly. All categories available in the app.
          </p>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24">
        <div className="section">
          <div className="text-center mb-14">
            <SectionLabel><Play size={12} /> How It Works</SectionLabel>
            <h2 className="text-4xl sm:text-5xl font-black text-brand-dark dark:text-white mt-2">
              From signup to<br />
              <span className="gradient-text">cash in 4 steps</span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map(({ step, title, desc, cta }) => (
              <div key={step} className="relative">
                {/* Connector line (not on last) */}
                {step !== '04' && (
                  <div className="hidden lg:block absolute top-8 left-[calc(100%+12px)] w-[calc(100%-24px)] h-px bg-slate-200 dark:bg-white/10 -translate-x-3" style={{ width: 'calc(100% - 24px)' }} />
                )}
                <div className="card p-6 h-full space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-brand-gradient flex items-center justify-center text-white font-black text-xl shadow-lg shadow-brand-blue/20">
                    {step}
                  </div>
                  <h3 className="font-bold text-lg text-brand-dark dark:text-white">{title}</h3>
                  <p className="text-sm text-slate-500 dark:text-white/50 leading-relaxed">{desc}</p>
                  {cta && (
                    <Link to={cta.href} className="inline-flex items-center gap-1 text-sm font-semibold text-brand-blue hover:gap-2 transition-all">
                      {cta.label} <ChevronRight size={14} />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────────── */}
      <section id="testimonials" className="py-24">
        <div className="section">
          <div className="text-center mb-14">
            <SectionLabel><Quote size={12} /> Loved by players</SectionLabel>
            <h2 className="text-4xl sm:text-5xl font-black text-brand-dark dark:text-white mt-2">
              What people are <span className="gradient-text">saying</span>
            </h2>
            <p className="text-slate-500 dark:text-white/50 mt-4 max-w-xl mx-auto">
              Real feedback from the ThinkTrophy community.
            </p>
          </div>

          {testimonialsLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="card p-6 animate-pulse space-y-4">
                  <div className="h-4 bg-slate-200 dark:bg-white/10 rounded w-3/4" />
                  <div className="h-3 bg-slate-200 dark:bg-white/10 rounded w-full" />
                  <div className="h-3 bg-slate-200 dark:bg-white/10 rounded w-5/6" />
                  <div className="h-10 bg-slate-200 dark:bg-white/10 rounded w-1/3 mt-4" />
                </div>
              ))}
            </div>
          ) : testimonialsError ? (
            <p className="text-center text-sm text-slate-500 dark:text-white/45 max-w-lg mx-auto">
              We could not load reviews right now. If you are running the site locally, start the API
              on port 4000 or set <code className="text-xs bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 rounded">VITE_API_URL</code> to your backend URL.
            </p>
          ) : testimonials.length === 0 ? (
            <p className="text-center text-sm text-slate-500 dark:text-white/45 max-w-lg mx-auto">
              Player reviews will appear here once they are added in the admin portal.
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {testimonials.map(t => (
                <article
                  key={t.id}
                  className="card p-6 flex flex-col border-slate-100 dark:border-white/5 hover:shadow-md dark:hover:border-white/10 transition-all"
                >
                  <Quote size={22} className="text-brand-blue/40 dark:text-brand-teal/50 flex-shrink-0 mb-3" />
                  <p className="text-slate-600 dark:text-white/70 leading-relaxed flex-1 text-sm sm:text-base">
                    “{t.quote}”
                  </p>
                  <TestimonialStars value={t.rating} />
                  <footer className="mt-5 pt-4 border-t border-slate-100 dark:border-white/10">
                    <p className="font-bold text-brand-dark dark:text-white">{t.author_name}</p>
                    {t.author_title && (
                      <p className="text-xs text-slate-400 dark:text-white/40 mt-0.5">{t.author_title}</p>
                    )}
                  </footer>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Payout info ──────────────────────────────────────────────────── */}
      <section className="py-16 bg-slate-50/80 dark:bg-brand-dark/40">
        <div className="section">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <SectionLabel><img src="/favicon.png" alt="ThinkTrophy" className="w-3 h-3 rounded-sm" /> Payout Structure</SectionLabel>
            <h2 className="text-3xl sm:text-4xl font-black text-brand-dark dark:text-white">
              Score high. Earn more.
            </h2>
            <div className="grid grid-cols-3 gap-4 mt-8">
              {[
                { score: '10 / 10', label: 'Perfect', multiplier: '2×', color: 'from-green-500 to-emerald-400', desc: 'Full payout at 2× your stake' },
                { score: '9 / 10',  label: 'Excellent', multiplier: '1.5×', color: 'from-brand-blue to-brand-teal', desc: 'Partial payout at 1.5× stake' },
                { score: '≤ 8/10', label: 'Try Again', multiplier: '0×', color: 'from-slate-400 to-slate-500', desc: 'Stake is forfeited. Keep practicing!' },
              ].map(({ score, label, multiplier, color, desc }) => (
                <div key={score} className="card p-5 text-center space-y-2">
                  <div className={`text-3xl font-black bg-gradient-to-r ${color} bg-clip-text text-transparent`}>
                    {multiplier}
                  </div>
                  <p className="font-bold text-brand-dark dark:text-white">{score}</p>
                  <p className="text-xs font-semibold text-slate-400 dark:text-white/40 uppercase tracking-wide">{label}</p>
                  <p className="text-xs text-slate-500 dark:text-white/40 leading-relaxed hidden sm:block">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Download CTA ─────────────────────────────────────────────────── */}
      <section id="download" className="py-24">
        <div className="section">
          <div className="rounded-3xl bg-brand-gradient p-12 sm:p-16 text-white text-center relative overflow-hidden">
            {/* Decorative blobs */}
            <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-white/10 rounded-full blur-2xl" />

            <div className="relative z-10 space-y-6 max-w-xl mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto">
                <Smartphone size={28} />
              </div>
              <h2 className="text-4xl sm:text-5xl font-black">Download the App</h2>
              <p className="text-lg opacity-80">
                The full ThinkTrophy experience is on mobile. Create an account on the web, then download the app to start playing.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
                {/* App Store */}
                <a
                  href={APP_STORE_URL}
                  className="flex items-center gap-3 bg-black/30 hover:bg-black/50 border border-white/20 rounded-2xl px-5 py-3.5 transition-all"
                >
                  <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white flex-shrink-0">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  <div className="text-left">
                    <p className="text-xs opacity-70">Download on the</p>
                    <p className="text-sm font-bold">App Store</p>
                  </div>
                </a>

                {/* Play Store */}
                <a
                  href={PLAY_STORE_URL}
                  className="flex items-center gap-3 bg-black/30 hover:bg-black/50 border border-white/20 rounded-2xl px-5 py-3.5 transition-all"
                >
                  <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white flex-shrink-0">
                    <path d="M3 20.5v-17c0-.83 1-.83 1.5-.5l14 8.5c.5.3.5 1.2 0 1.5l-14 8.5c-.5.3-1.5.3-1.5-.5z"/>
                  </svg>
                  <div className="text-left">
                    <p className="text-xs opacity-70">Get it on</p>
                    <p className="text-sm font-bold">Google Play</p>
                  </div>
                </a>
              </div>

              <p className="text-xs opacity-50 pt-2">
                App links coming soon. Sign up now to be notified at launch.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────── */}
      <section className="py-20 bg-slate-50/80 dark:bg-brand-dark/40">
        <div className="section text-center space-y-6">
          <h2 className="text-4xl sm:text-5xl font-black text-brand-dark dark:text-white">
            Ready to start winning?
          </h2>
          <p className="text-slate-500 dark:text-white/50 text-lg max-w-md mx-auto">
            Join thousands of players already earning from their knowledge. Sign up takes less than a minute.
          </p>
          <Link to="/signup" className="btn-primary text-base px-8 py-4 shadow-xl shadow-brand-blue/20 inline-flex">
            Create Your Free Account <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </>
  );
}
