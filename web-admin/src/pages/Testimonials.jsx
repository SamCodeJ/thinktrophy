import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Star, ShieldAlert } from 'lucide-react';
import {
  getTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
} from '../api';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';

const emptyForm = {
  author_name: '',
  author_title: '',
  quote: '',
  rating: '',
  sort_order: 0,
  is_active: true,
};

function Stars({ value }) {
  if (value == null || value < 1) return <span className="text-white/25 text-xs">—</span>;
  return (
    <span className="inline-flex items-center gap-0.5 text-yellow-400">
      {Array.from({ length: value }, (_, i) => (
        <Star key={i} size={12} className="fill-yellow-400" />
      ))}
    </span>
  );
}

export default function Testimonials() {
  const qc = useQueryClient();
  const { admin } = useAuth();
  const canEdit = admin?.role === 'super_admin' || admin?.role === 'moderator';

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['testimonials'],
    queryFn: getTestimonials,
  });

  const rows = data?.data ?? [];
  const hiddenCount = useMemo(() => rows.filter(r => r.is_active === false).length, [rows]);
  const liveCount = useMemo(() => rows.filter(r => r.is_active !== false).length, [rows]);

  const sorted = useMemo(
    () => [...rows].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || new Date(b.created_at) - new Date(a.created_at)),
    [rows]
  );

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(row) {
    setEditingId(row.id);
    setForm({
      author_name: row.author_name || '',
      author_title: row.author_title || '',
      quote: row.quote || '',
      rating: row.rating != null ? String(row.rating) : '',
      sort_order: row.sort_order ?? 0,
      is_active: row.is_active !== false,
    });
    setModalOpen(true);
  }

  function payloadFromForm() {
    const rating =
      form.rating === '' || form.rating == null ? null : parseInt(form.rating, 10);
    return {
      author_name: form.author_name.trim(),
      author_title: form.author_title.trim() || null,
      quote: form.quote.trim(),
      rating: Number.isFinite(rating) ? rating : null,
      sort_order: parseInt(form.sort_order, 10) || 0,
      is_active: form.is_active,
    };
  }

  const saveMut = useMutation({
    mutationFn: () => {
      const body = payloadFromForm();
      if (editingId) return updateTestimonial(editingId, body);
      return createTestimonial(body);
    },
    onSuccess: () => {
      qc.invalidateQueries(['testimonials']);
      toast.success(editingId ? 'Testimonial updated' : 'Testimonial added');
      setModalOpen(false);
    },
    onError: e => toast.error(e?.error?.message || 'Save failed'),
  });

  const deleteMut = useMutation({
    mutationFn: deleteTestimonial,
    onSuccess: () => {
      qc.invalidateQueries(['testimonials']);
      toast.success('Testimonial hidden from landing page');
    },
    onError: e => toast.error(e?.error?.message || 'Could not remove'),
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  if (isLoading) return <div className="h-40 bg-white/5 rounded-2xl animate-pulse" />;

  if (isError) {
    return (
      <div className="space-y-4 max-w-5xl">
        <h1 className="text-2xl font-bold text-white">Landing testimonials</h1>
        <div className="card p-6 border border-red-500/30 bg-red-500/10 text-red-200/90 text-sm space-y-3">
          <p>Could not load testimonials. Is the API running and reachable?</p>
          <p className="text-white/50 font-mono text-xs break-all">
            {error?.error?.message || error?.message || String(error)}
          </p>
          <button type="button" onClick={() => refetch()} className="btn-secondary text-sm">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Landing testimonials</h1>
          <p className="text-white/40 text-sm mt-1">
            Only <strong className="text-white/70">Live</strong> quotes appear on the marketing site. Delete hides a quote (soft delete); edit it and turn{' '}
            <strong className="text-white/70">Show on landing page</strong> back on to show it again.
          </p>
          <p className="text-white/30 text-xs mt-2">
            In this list: <span className="text-green-400/90">{liveCount} live</span>
            {hiddenCount > 0 && (
              <span className="text-white/40"> · {hiddenCount} hidden (not on landing)</span>
            )}
          </p>
        </div>
        {canEdit && (
          <button type="button" onClick={openCreate} className="btn-primary inline-flex items-center gap-2 self-start">
            <Plus size={18} /> Add testimonial
          </button>
        )}
      </div>

      {!canEdit && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-200/90 text-sm">
          <ShieldAlert size={18} className="flex-shrink-0 mt-0.5" />
          <span>Your role can view testimonials. Ask a moderator or super admin to add or edit them.</span>
        </div>
      )}

      {hiddenCount > 0 && (
        <div className="p-4 rounded-xl bg-brand-blue/10 border border-brand-blue/25 text-sm text-white/85">
          <strong className="text-white">{hiddenCount} testimonial{hiddenCount === 1 ? ' is' : 's are'} hidden.</strong>{' '}
          They will not show on the landing page until you edit each one and enable <strong>Show on landing page</strong>.
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-white/40">
                <th className="py-3 px-4 font-medium">Order</th>
                <th className="py-3 px-4 font-medium">Author</th>
                <th className="py-3 px-4 font-medium">Quote</th>
                <th className="py-3 px-4 font-medium">Rating</th>
                <th className="py-3 px-4 font-medium">Status</th>
                {canEdit && <th className="py-3 px-4 font-medium w-28">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 6 : 5} className="py-12 text-center text-white/35">
                    No testimonials yet. {canEdit ? 'Add one to show quotes on the landing page.' : ''}
                  </td>
                </tr>
              ) : (
                sorted.map(row => (
                  <tr key={row.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="py-3 px-4 text-white/60 font-mono text-xs">{row.sort_order ?? 0}</td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-white">{row.author_name}</p>
                      {row.author_title && (
                        <p className="text-xs text-white/35 mt-0.5">{row.author_title}</p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-white/70 max-w-md">
                      <p className="line-clamp-2">{row.quote}</p>
                    </td>
                    <td className="py-3 px-4">
                      <Stars value={row.rating} />
                    </td>
                    <td className="py-3 px-4">
                      {row.is_active ? (
                        <span className="text-xs px-2 py-0.5 rounded-lg bg-green-500/15 text-green-400">Live</span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-lg bg-white/10 text-white/40">Hidden</span>
                      )}
                    </td>
                    {canEdit && (
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEdit(row)}
                            className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          {row.is_active && (
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm('Hide this testimonial from the landing page?')) {
                                  deleteMut.mutate(row.id);
                                }
                              }}
                              className="p-2 rounded-lg text-white/50 hover:text-red-400 hover:bg-white/10"
                              title="Hide from landing"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit testimonial' : 'New testimonial'}
        size="md"
      >
        <form
          className="space-y-4"
          onSubmit={e => {
            e.preventDefault();
            saveMut.mutate();
          }}
        >
          <div>
            <label className="block text-sm text-white/60 mb-1.5">Name</label>
            <input
              className="input"
              value={form.author_name}
              onChange={e => set('author_name', e.target.value)}
              required
              maxLength={120}
              placeholder="e.g. Chidi O."
            />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1.5">Subtitle (optional)</label>
            <input
              className="input"
              value={form.author_title}
              onChange={e => set('author_title', e.target.value)}
              maxLength={200}
              placeholder="City, role, or short descriptor"
            />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1.5">Quote</label>
            <textarea
              className="input min-h-[120px] resize-y"
              value={form.quote}
              onChange={e => set('quote', e.target.value)}
              required
              minLength={3}
              placeholder="What they said about ThinkTrophy..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/60 mb-1.5">Star rating (optional)</label>
              <select
                className="input"
                value={form.rating}
                onChange={e => set('rating', e.target.value)}
              >
                <option value="">No stars</option>
                {[1, 2, 3, 4, 5].map(n => (
                  <option key={n} value={String(n)}>
                    {n} star{n > 1 ? 's' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1.5">Sort order</label>
              <input
                className="input"
                type="number"
                min={0}
                max={99999}
                value={form.sort_order}
                onChange={e => set('sort_order', e.target.value)}
              />
              <p className="text-xs text-white/30 mt-1">Lower numbers appear first on the site.</p>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={e => set('is_active', e.target.checked)}
              className="rounded border-white/20"
            />
            Show on landing page
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saveMut.isPending || !canEdit}>
              {saveMut.isPending ? 'Saving…' : editingId ? 'Save changes' : 'Add testimonial'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
