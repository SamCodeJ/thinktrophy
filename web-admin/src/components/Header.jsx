import { useState } from 'react';
import { Menu, Bell, KeyRound } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import Modal from './Modal';
import { adminUpdatePassword } from '../api';
import toast from 'react-hot-toast';

export default function Header({ onMenuClick }) {
  const { admin } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [form, setForm] = useState({ old_password: '', new_password: '' });
  const [loading, setLoading] = useState(false);

  async function handleUpdatePassword(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await adminUpdatePassword(form);
      toast.success(res.data.message);
      setShowModal(false);
      setForm({ old_password: '', new_password: '' });
    } catch (err) {
      toast.error(err?.error?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <header className="h-16 bg-brand-dark border-b border-white/5 flex items-center px-6 gap-4 flex-shrink-0 relative">
        <button onClick={onMenuClick} className="text-white/50 hover:text-white transition-colors lg:hidden">
          <Menu size={20} />
        </button>
        <div className="flex-1" />
        <button className="text-white/50 hover:text-white transition-colors relative">
          <Bell size={20} />
        </button>
        
        <div className="relative">
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 focus:outline-none"
          >
            <div className="w-8 h-8 rounded-full bg-brand-gradient flex items-center justify-center text-sm font-bold text-white">
              {admin?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <span className="text-sm text-white/70 hidden sm:block">{admin?.name}</span>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-brand-card border border-white/10 rounded-xl shadow-xl z-50 py-1">
              <button 
                onClick={() => { setShowModal(true); setDropdownOpen(false); }}
                className="w-full text-left px-4 py-2 text-sm text-white/70 hover:bg-white/5 hover:text-white flex items-center gap-2 transition-colors"
              >
                <KeyRound size={16} />
                Change Password
              </button>
            </div>
          )}
        </div>
      </header>

      {/* onClick outside listener for dropdown could be added, but simpler is fine for now */}
      {dropdownOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setDropdownOpen(false)} 
        />
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Change Password" size="sm">
        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div>
            <label className="block text-sm text-white/60 mb-1.5">Current Password</label>
            <input
              type="password"
              className="input w-full"
              placeholder="••••••••"
              value={form.old_password}
              onChange={e => setForm(f => ({ ...f, old_password: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1.5">New Password</label>
            <input
              type="password"
              className="input w-full"
              placeholder="••••••••"
              value={form.new_password}
              onChange={e => setForm(f => ({ ...f, new_password: e.target.value }))}
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-white/60 hover:text-white transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}