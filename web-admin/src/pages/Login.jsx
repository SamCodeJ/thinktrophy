import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Eye, EyeOff, KeyRound } from 'lucide-react';
import { adminLogin, adminForgotPassword, adminResetPassword } from '../api';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

export default function Login() {
  const [view, setView] = useState('login'); // 'login' | 'forgot' | 'reset'
  const [form, setForm] = useState({ email: '', password: '', code: '', new_password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await adminLogin({ email: form.email, password: form.password });
      login(res.data.admin, res.data.token);
      toast.success(`Welcome back, ${res.data.admin.name}!`);
      navigate('/');
    } catch (err) {
      toast.error(err?.error?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleForgot(e) {
    e.preventDefault();
    if (!form.email) return toast.error('Please enter your email first');
    setLoading(true);
    try {
      const res = await adminForgotPassword({ email: form.email });
      toast.success(res.data.message);
      setView('reset');
    } catch (err) {
      toast.error(err?.error?.message || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await adminResetPassword({ email: form.email, code: form.code, new_password: form.new_password });
      toast.success(res.data.message);
      setView('login');
      setForm(f => ({ ...f, password: '', code: '', new_password: '' }));
    } catch (err) {
      toast.error(err?.error?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-darker px-4">
      {/* Background gradient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-brand-blue/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-brand-teal/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="card p-8">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-4 shadow-lg shadow-brand-blue/30">
              <img src="/favicon.png" alt="ThinkTrophy" className="w-16 h-16 rounded-2xl" />
            </div>
            <h1 className="text-2xl font-bold text-white">ThinkTrophy</h1>
            <p className="text-white/40 text-sm mt-1">Admin Portal</p>
          </div>

          {view === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/60 mb-1.5">Email</label>
                <input
                  type="email"
                  className="input"
                  placeholder="admin@thinktrophy.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  required
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-white/60">Password</label>
                  <button type="button" onClick={() => setView('forgot')} className="text-xs text-brand-blue hover:text-brand-blue/80">Forgot?</button>
                </div>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    className="input pr-11"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
                  >
                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
              >
                {loading ? 'Processing...' : 'Sign In'}
              </button>
            </form>
          )}

          {view === 'forgot' && (
            <form onSubmit={handleForgot} className="space-y-4">
              <div className="text-center mb-4">
                <h2 className="text-white font-semibold">Forgot Password</h2>
                <p className="text-white/50 text-sm">Enter your email to receive a reset code.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/60 mb-1.5">Email</label>
                <input
                  type="email"
                  className="input"
                  placeholder="admin@thinktrophy.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
              >
                {loading ? 'Sending...' : 'Send Reset Code'}
              </button>
              <button
                type="button"
                onClick={() => setView('login')}
                className="w-full text-sm text-white/40 hover:text-white mt-4"
              >
                Back to Login
              </button>
            </form>
          )}

          {view === 'reset' && (
            <form onSubmit={handleReset} className="space-y-4">
              <div className="text-center mb-4">
                <h2 className="text-white font-semibold">Reset Password</h2>
                <p className="text-white/50 text-sm">Enter the code sent to your email.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/60 mb-1.5">Reset Code</label>
                <input
                  type="text"
                  className="input text-center text-xl tracking-[0.25em]"
                  placeholder="123456"
                  maxLength={6}
                  value={form.code}
                  onChange={e => setForm(f => ({ ...f, code: e.target.value.replace(/[^0-9]/g, '') }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/60 mb-1.5">New Password</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    className="input pr-11"
                    placeholder="••••••••"
                    value={form.new_password}
                    onChange={e => setForm(f => ({ ...f, new_password: e.target.value }))}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
                  >
                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
              <button
                type="button"
                onClick={() => setView('login')}
                className="w-full text-sm text-white/40 hover:text-white mt-4"
              >
                Back to Login
              </button>
            </form>
          )}

          <p className="text-center text-xs text-white/20 mt-6">
            Think Sharp. Win Big. — Admin Portal v1.0
          </p>
        </div>
      </div>
    </div>
  );
}