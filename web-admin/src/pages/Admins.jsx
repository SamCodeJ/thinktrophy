import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Shield, UserCog } from 'lucide-react';
import { getAdmins, createAdminAccount, updateAdminRole } from '../api';
import Modal from '../components/Modal';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

export default function Admins() {
  const qc = useQueryClient();
  const { admin } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'viewer' });

  const { data, isLoading } = useQuery({ 
    queryKey: ['admin-list'], 
    queryFn: getAdmins 
  });
  
  const admins = data?.data || [];

  const createMut = useMutation({
    mutationFn: createAdminAccount,
    onSuccess: () => { 
      qc.invalidateQueries(['admin-list']); 
      setModalOpen(false); 
      toast.success('Admin added');
      setForm({ name: '', email: '', password: '', role: 'viewer' });
    },
    onError: (e) => toast.error(e?.response?.data?.error?.message || e?.error?.message || 'Failed to create admin'),
  });

  const roleMut = useMutation({
    mutationFn: ({ id, role }) => updateAdminRole(id, { role }),
    onSuccess: () => { 
      qc.invalidateQueries(['admin-list']); 
      toast.success('Role updated'); 
    },
    onError: (e) => toast.error(e?.response?.data?.error?.message || e?.error?.message || 'Failed to update role'),
  });

  const isSuperAdmin = admin?.role === 'super_admin';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Administrators</h1>
          <p className="text-white/40 text-sm mt-1">Manage team access and roles</p>
        </div>
        {isSuperAdmin && (
          <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Add Admin
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          [...Array(3)].map((_, i) => <div key={i} className="h-32 bg-white/5 rounded-2xl animate-pulse" />)
        ) : (
          admins.map(a => (
            <div key={a.id} className="card p-5 flex flex-col gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-brand-gradient flex items-center justify-center text-xl font-bold text-white flex-shrink-0">
                  {a.name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white truncate">{a.name}</h3>
                  <p className="text-xs text-white/50 truncate mb-2">{a.email}</p>
                  
                  <div className="flex items-center justify-between mt-1">
                    {isSuperAdmin && a.id !== admin.id ? (
                      <select 
                        value={a.role} 
                        onChange={e => roleMut.mutate({ id: a.id, role: e.target.value })}
                        disabled={roleMut.isPending}
                        className="bg-black/20 border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-blue"
                      >
                        <option value="super_admin">Super Admin</option>
                        <option value="moderator">Moderator</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    ) : (
                      <span className={`px-2 py-1 rounded-md text-xs font-medium border
                        ${a.role === 'super_admin' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 
                          a.role === 'moderator' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 
                          'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}
                      >
                        {a.role.replace('_', ' ').toUpperCase()}
                      </span>
                    )}

                    {a.id === admin.id && (
                      <span className="text-xs text-brand-teal font-medium bg-brand-teal/10 px-2 py-1 rounded">You</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Administrator" size="sm">
        <form onSubmit={e => { e.preventDefault(); createMut.mutate(form); }} className="space-y-4">
          <div>
            <label className="block text-sm text-white/60 mb-1.5">Full Name</label>
            <input 
              className="input" 
              value={form.name} 
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} 
              required 
            />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1.5">Email</label>
            <input 
              type="email"
              className="input" 
              value={form.email} 
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))} 
              required 
            />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1.5">Temporary Password</label>
            <input 
              type="password"
              className="input" 
              value={form.password} 
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))} 
              required 
              minLength={6}
            />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1.5">Role</label>
            <select 
              className="select" 
              value={form.role} 
              onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
            >
              <option value="viewer">Viewer (Read-only)</option>
              <option value="moderator">Moderator (Can edit content)</option>
              <option value="super_admin">Super Admin (Full access)</option>
            </select>
          </div>
          <button type="submit" disabled={createMut.isPending} className="btn-primary w-full mt-2">
            {createMut.isPending ? 'Creating...' : 'Create Admin'}
          </button>
        </form>
      </Modal>
    </div>
  );
}