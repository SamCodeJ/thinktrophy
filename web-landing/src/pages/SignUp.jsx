import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, Check, AlertCircle, User, Mail, Lock, Phone, Calendar, Type, Loader2 } from 'lucide-react';
import axios from 'axios';

const rules = [
  { label: 'At least 8 characters', test: p => p.length >= 8 },
  { label: 'One uppercase letter', test: p => /[A-Z]/.test(p) },
  { label: 'One number', test: p => /[0-9]/.test(p) },
];

function ymdLocal(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function maxAdultDob() {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 18);
  return ymdLocal(d);
}

function minDob() {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 100);
  return ymdLocal(d);
}

export default function SignUp() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ 
    username: '', email: '', password: '', confirm: '', 
    first_name: '', last_name: '', phone_number: '', dob: '' 
  });
  const [showPw, setShowPw]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed]         = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [usernameStatus, setUsernameStatus] = useState({ state: 'idle', message: '' });

  const set = (k, v) => {
    setError('');
    setForm(f => ({ ...f, [k]: v }));
  };

  useEffect(() => {
    const username = form.username.trim();
    if (!username) {
      setUsernameStatus({ state: 'idle', message: '' });
      return;
    }
    if (username.length < 3) {
      setUsernameStatus({ state: 'invalid', message: 'At least 3 characters' });
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setUsernameStatus({ state: 'invalid', message: 'Letters, numbers, and underscores only' });
      return;
    }

    let cancelled = false;
    setUsernameStatus({ state: 'checking', message: 'Checking availability…' });
    const timer = setTimeout(async () => {
      try {
        const res = await axios.get('/api/auth/username-available', { params: { username } });
        if (cancelled) return;
        const data = res.data?.data || {};
        setUsernameStatus({
          state: data.available ? 'available' : 'taken',
          message: data.message || (data.available ? 'Username is available' : 'Username is already taken'),
        });
      } catch {
        if (!cancelled) setUsernameStatus({ state: 'idle', message: '' });
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [form.username]);

  const passwordChecks = useMemo(
    () => rules.map(rule => ({ ...rule, ok: rule.test(form.password) })),
    [form.password]
  );
  const pwStrength = passwordChecks.filter(r => r.ok).length;
  const passwordStrong = pwStrength === rules.length;
  const usernameOk = usernameStatus.state === 'available';
  const canSubmit = agreed && usernameOk && passwordStrong && form.password === form.confirm && !loading;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!usernameOk) {
      setError(usernameStatus.message || 'Please choose an available username.');
      return;
    }
    if (!passwordStrong) {
      setError('Password must be at least 8 characters with one uppercase letter and one number.');
      return;
    }
    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (!agreed) {
      setError('Please accept the Terms of Service to continue.');
      return;
    }

    setLoading(true);
    try {
      await axios.post('/api/auth/register', {
        username: form.username,
        email:    form.email,
        password: form.password,
        first_name: form.first_name,
        last_name: form.last_name,
        phone_number: form.phone_number,
        dob: form.dob,
      });
      navigate('/download', { state: { fromSignup: true, username: form.username } });
    } catch (err) {
      const msg = err.response?.data?.error?.message
               || err.response?.data?.message
               || 'Registration failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-20 px-4 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/30 to-teal-50/20 dark:from-brand-darker dark:to-brand-dark" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-blue/8 dark:bg-brand-blue/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-brand-teal/8 dark:bg-brand-teal/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md space-y-6">
        {/* Card */}
        <div className="card p-8 shadow-xl dark:shadow-black/20">
          {/* Header */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-5">
              <img src="/favicon.png" alt="ThinkTrophy" className="w-11 h-11 rounded-2xl shadow-lg shadow-brand-blue/30" />
              <span className="font-bold text-xl text-brand-dark dark:text-white">
                Think<span className="gradient-text">Trophy</span>
              </span>
            </Link>
            <h1 className="text-2xl font-black text-brand-dark dark:text-white">Create your account</h1>
            <p className="text-slate-500 dark:text-white/50 text-sm mt-1">
              Join thousands of players and start winning today
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 mb-5">
              <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* First Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-white/70 mb-1.5">
                  First Name
                </label>
                <div className="relative">
                  <Type size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/30 pointer-events-none" />
                  <input
                    className="input pl-10"
                    type="text"
                    placeholder="John"
                    value={form.first_name}
                    onChange={e => set('first_name', e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-white/70 mb-1.5">
                  Last Name
                </label>
                <div className="relative">
                  <Type size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/30 pointer-events-none" />
                  <input
                    className="input pl-10"
                    type="text"
                    placeholder="Doe"
                    value={form.last_name}
                    onChange={e => set('last_name', e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Date of Birth and Phone */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-white/70 mb-1.5">
                  Date of Birth
                </label>
                <div className="relative">
                  <Calendar size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/30 pointer-events-none" />
                  <input
                    className="input pl-10"
                    type="date"
                    value={form.dob}
                    onChange={e => set('dob', e.target.value)}
                    required
                    min={minDob()}
                    max={maxAdultDob()}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-white/70 mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/30 pointer-events-none" />
                  <input
                    className="input pl-10"
                    type="tel"
                    placeholder="+234..."
                    value={form.phone_number}
                    onChange={e => set('phone_number', e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-white/70 mb-1.5">
                Username
              </label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/30 pointer-events-none" />
                <input
                  className="input pl-10 pr-10"
                  type="text"
                  placeholder="thinktrophy_pro"
                  value={form.username}
                  onChange={e => set('username', e.target.value.replace(/\s/g, ''))}
                  required
                  minLength={3}
                  maxLength={30}
                  pattern="[a-zA-Z0-9_]+"
                  title="Letters, numbers, and underscores only"
                  autoComplete="username"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2">
                  {usernameStatus.state === 'checking' && <Loader2 size={14} className="animate-spin text-slate-400" />}
                  {usernameStatus.state === 'available' && <Check size={14} className="text-green-500" />}
                  {(usernameStatus.state === 'taken' || usernameStatus.state === 'invalid') && (
                    <AlertCircle size={14} className="text-red-500" />
                  )}
                </span>
              </div>
              {usernameStatus.message && (
                <p className={`text-xs mt-1.5 ${
                  usernameStatus.state === 'available' ? 'text-green-600 dark:text-green-400'
                  : usernameStatus.state === 'checking' ? 'text-slate-400 dark:text-white/40'
                  : 'text-red-500'
                }`}>
                  {usernameStatus.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-white/70 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/30 pointer-events-none" />
                <input
                  className="input pl-10"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-white/70 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/30 pointer-events-none" />
                <input
                  className="input pl-10 pr-11"
                  type={showPw ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  value={form.password}
                  onChange={e => set('password', e.target.value)}
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/30 hover:text-slate-600 dark:hover:text-white/70 transition-colors"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Strength meter */}
              {form.password && (
                <div className="mt-2.5 space-y-2">
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                          i < pwStrength
                            ? pwStrength === 1 ? 'bg-red-400'
                            : pwStrength === 2 ? 'bg-yellow-400'
                            : 'bg-green-400'
                            : 'bg-slate-200 dark:bg-white/10'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-x-2">
                    {passwordChecks.map(rule => (
                      <div key={rule.label} className="flex items-center gap-1">
                        <Check
                          size={11}
                          className={`flex-shrink-0 transition-colors ${rule.ok ? 'text-green-500' : 'text-slate-300 dark:text-white/20'}`}
                        />
                        <span className={`text-xs transition-colors ${rule.ok ? 'text-green-600 dark:text-green-400' : 'text-slate-400 dark:text-white/30'}`}>
                          {rule.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-white/70 mb-1.5">
                Confirm password
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/30 pointer-events-none" />
                <input
                  className={`input pl-10 pr-11 ${form.confirm && form.confirm !== form.password ? 'border-red-300 dark:border-red-500/40 focus:ring-red-400/30' : ''}`}
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Repeat your password"
                  value={form.confirm}
                  onChange={e => set('confirm', e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/30 hover:text-slate-600 dark:hover:text-white/70 transition-colors"
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {form.confirm && form.confirm !== form.password && (
                <p className="text-xs text-red-500 mt-1.5">Passwords do not match</p>
              )}
            </div>

            {/* Terms */}
            <label className="flex items-start gap-3 cursor-pointer group mt-2">
              <input
                type="checkbox"
                className="sr-only"
                checked={agreed}
                onChange={() => setAgreed(a => !a)}
              />
              <div className={`w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center mt-0.5 transition-all
                ${agreed ? 'bg-brand-blue border-brand-blue' : 'border-slate-300 dark:border-white/20 group-hover:border-brand-blue'}`}
              >
                {agreed && <Check size={11} className="text-white" />}
              </div>
              <span className="text-sm text-slate-600 dark:text-white/60 leading-relaxed">
                I agree to the{' '}
                <Link to="/terms" className="text-brand-blue hover:underline" onClick={e => e.stopPropagation()}>Terms of Service</Link>
                {' '}and{' '}
                <Link to="/privacy-policy" className="text-brand-blue hover:underline" onClick={e => e.stopPropagation()}>Privacy Policy</Link>
              </span>
            </label>

            <button
              type="submit"
              disabled={!canSubmit}
              className={`btn-primary w-full py-3.5 mt-2 ${
                !canSubmit
                  ? 'opacity-40 cursor-not-allowed shadow-none hover:opacity-40 active:scale-100'
                  : ''
              }`}
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <>Create Account <ArrowRight size={17} /></>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 dark:text-white/40 mt-6">
            Already have an account?{' '}
            <span className="text-brand-blue font-medium cursor-default">
              Sign in via the mobile app
            </span>
          </p>
        </div>

        {/* Benefits strip */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: '🔒', text: 'Secure & encrypted' },
            { icon: '⚡', text: 'Instant setup' },
            { icon: '🏆', text: 'Start winning today' },
          ].map(({ icon, text }) => (
            <div key={text} className="card p-3 text-center">
              <p className="text-xl mb-1">{icon}</p>
              <p className="text-xs text-slate-500 dark:text-white/40 font-medium">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
