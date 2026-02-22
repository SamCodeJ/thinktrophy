import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, ToggleLeft, ToggleRight, ChevronRight, ChevronLeft, Search, X } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { getAdminCategories, createCategory, updateCategory, getCategoryQuestions } from '../api';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

// Legacy map keeps old icon_name strings displayable for existing records
const ICON_MAP = {
  flask: '🧪', landmark: '🏛️', trophy: '🏆', cpu: '💻', star: '⭐',
  music: '🎵', globe: '🌍', book: '📖', heart: '❤️', zap: '⚡',
};

function resolveIcon(icon_name) {
  return ICON_MAP[icon_name] || icon_name || '📚';
}

const DIFF_STYLES = {
  easy:   { label: 'Easy',   bg: 'bg-green-500/15',  text: 'text-green-400',  bar: 'bg-green-500'  },
  medium: { label: 'Medium', bg: 'bg-yellow-500/15', text: 'text-yellow-400', bar: 'bg-yellow-500' },
  hard:   { label: 'Hard',   bg: 'bg-red-500/15',    text: 'text-red-400',    bar: 'bg-red-500'    },
};

function DifficultyBreakdown({ questions }) {
  const counts = useMemo(() => {
    const c = { easy: 0, medium: 0, hard: 0 };
    questions.forEach(q => { if (c[q.difficulty] !== undefined) c[q.difficulty]++; });
    return c;
  }, [questions]);

  const total = questions.length || 1;

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        {['easy', 'medium', 'hard'].map(d => {
          const s = DIFF_STYLES[d];
          return (
            <div key={d} className={`flex-1 rounded-xl ${s.bg} p-3 text-center`}>
              <p className={`text-xl font-bold ${s.text}`}>{counts[d]}</p>
              <p className={`text-xs font-medium ${s.text} opacity-80 mt-0.5`}>{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Stacked bar */}
      <div className="flex h-2 rounded-full overflow-hidden gap-px">
        {['easy', 'medium', 'hard'].map(d => {
          const pct = (counts[d] / total) * 100;
          return pct > 0 ? (
            <div
              key={d}
              className={`${DIFF_STYLES[d].bar} transition-all`}
              style={{ width: `${pct}%` }}
              title={`${DIFF_STYLES[d].label}: ${counts[d]}`}
            />
          ) : null;
        })}
      </div>
      <p className="text-xs text-white/30 text-right">{questions.length} questions total</p>
    </div>
  );
}

function QuestionCard({ question, index }) {
  const [expanded, setExpanded] = useState(false);
  const s = DIFF_STYLES[question.difficulty] || DIFF_STYLES.medium;
  const correct = question.correct_option?.toLowerCase();

  const optionLabels = { a: 'A', b: 'B', c: 'C', d: 'D' };

  return (
    <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
      <button
        onClick={() => setExpanded(x => !x)}
        className="w-full text-left p-4 flex items-start gap-3 hover:bg-white/5 transition-colors"
      >
        <span className="text-xs text-white/30 font-mono mt-0.5 flex-shrink-0 w-6 text-right">{index}.</span>
        <p className="flex-1 text-sm text-white/85 leading-snug">{question.question_text}</p>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-xs px-2 py-0.5 rounded-lg font-medium ${s.bg} ${s.text}`}>
            {s.label}
          </span>
          <ChevronRight size={14} className={`text-white/30 transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-0 space-y-1.5 border-t border-white/5">
          {['a', 'b', 'c', 'd'].map(opt => {
            const isCorrect = correct === opt;
            return (
              <div
                key={opt}
                className={`flex items-start gap-2.5 p-2 rounded-lg text-sm transition-colors
                  ${isCorrect ? 'bg-green-500/15 border border-green-500/30' : 'bg-white/3'}`}
              >
                <span className={`font-bold flex-shrink-0 w-5 text-center ${isCorrect ? 'text-green-400' : 'text-white/30'}`}>
                  {optionLabels[opt]}
                </span>
                <span className={isCorrect ? 'text-green-300' : 'text-white/60'}>
                  {question[`option_${opt}`]}
                </span>
                {isCorrect && (
                  <span className="ml-auto text-xs text-green-400 font-medium flex-shrink-0">✓ Correct</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const Q_PAGE_SIZE_OPTIONS = [10, 15, 25, 50];

function CategoryQuestionsModal({ cat, onClose }) {
  const [diffFilter, setDiffFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const { data, isLoading } = useQuery({
    queryKey: ['category-questions', cat.id],
    queryFn: () => getCategoryQuestions(cat.id),
    staleTime: 30_000,
  });

  const allQuestions = data?.data || [];

  const filtered = useMemo(() => {
    let list = allQuestions;
    if (diffFilter !== 'all') list = list.filter(q => q.difficulty === diffFilter);
    if (search.trim()) {
      const term = search.toLowerCase();
      list = list.filter(q => q.question_text?.toLowerCase().includes(term));
    }
    return list;
  }, [allQuestions, diffFilter, search]);

  // Reset to page 1 whenever filter, search, or page size changes
  useEffect(() => { setPage(1); }, [diffFilter, search, pageSize]);

  const totalPages  = Math.ceil(filtered.length / pageSize);
  const pageStart   = (page - 1) * pageSize;
  const paged       = filtered.slice(pageStart, pageStart + pageSize);
  const fromQ       = filtered.length === 0 ? 0 : pageStart + 1;
  const toQ         = Math.min(page * pageSize, filtered.length);

  const iconEmoji = resolveIcon(cat.icon_name);

  return (
    <div className="space-y-5">
      {/* Category header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-gradient flex items-center justify-center text-xl flex-shrink-0">
          {iconEmoji}
        </div>
        <div>
          <h2 className="font-bold text-white text-lg">{cat.name}</h2>
          {cat.description && <p className="text-xs text-white/40">{cat.description}</p>}
        </div>
      </div>

      {/* Difficulty breakdown */}
      {isLoading ? (
        <div className="h-24 bg-white/5 rounded-xl animate-pulse" />
      ) : (
        <DifficultyBreakdown questions={allQuestions} />
      )}

      {/* Sticky filters */}
      <div className="flex items-center gap-3 sticky top-0 z-10 bg-brand-card py-2 -mx-1 px-1">
        <div className="flex gap-1 p-1 bg-white/5 rounded-xl">
          {['all', 'easy', 'medium', 'hard'].map(d => (
            <button
              key={d}
              onClick={() => setDiffFilter(d)}
              className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-all
                ${diffFilter === d
                  ? d === 'all' ? 'bg-white/15 text-white' : `${DIFF_STYLES[d]?.bg} ${DIFF_STYLES[d]?.text}`
                  : 'text-white/40 hover:text-white/70'
                }`}
            >
              {d === 'all' ? 'All' : DIFF_STYLES[d].label}
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            className="input pl-8 py-1.5 text-sm w-full"
            placeholder="Search questions…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Questions list */}
      <div className="space-y-2">
        {isLoading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="h-14 bg-white/5 rounded-xl animate-pulse" />
          ))
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-white/30">
            <p className="text-3xl mb-2">🔍</p>
            <p className="text-sm">No questions match your filter</p>
          </div>
        ) : (
          paged.map((q, i) => (
            <QuestionCard key={q.id} question={q} index={pageStart + i + 1} />
          ))
        )}
      </div>

      {/* Pagination footer */}
      {!isLoading && filtered.length > 0 && (
        <div className="flex items-center justify-between pt-2 border-t border-white/5 gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/30">Per page:</span>
              <select
                value={pageSize}
                onChange={e => setPageSize(Number(e.target.value))}
                className="bg-[#1E272E] border border-white/10 rounded-lg text-xs text-white
                           px-2 py-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-brand-blue/50"
              >
                {Q_PAGE_SIZE_OPTIONS.map(n => <option key={n} value={n} className="bg-[#1E272E] text-white">{n} per page</option>)}
              </select>
            </div>
            <p className="text-xs text-white/25">
              {filtered.length < allQuestions.length
                ? `${fromQ}–${toQ} of ${filtered.length} filtered (${allQuestions.length} total)`
                : `${fromQ}–${toQ} of ${allQuestions.length} questions`}
            </p>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="p-1 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-xs text-white/50 px-2">{page} / {totalPages}</span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="p-1 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Categories() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(null); // null | 'add' | 'edit' | 'questions'
  const [editing, setEditing] = useState(null);
  const [selectedCat, setSelectedCat] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', icon_name: '⭐' });
  const [showPicker, setShowPicker] = useState(false);

  const { data, isLoading } = useQuery({ queryKey: ['admin-categories'], queryFn: getAdminCategories });
  const categories = data?.data || [];

  const createMut = useMutation({
    mutationFn: createCategory,
    onSuccess: () => { qc.invalidateQueries(['admin-categories']); setModal(null); toast.success('Category created'); },
    onError: (e) => toast.error(e?.error?.message || 'Failed'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => updateCategory(id, data),
    onSuccess: () => { qc.invalidateQueries(['admin-categories']); setModal(null); toast.success('Category updated'); },
    onError: (e) => toast.error(e?.error?.message || 'Failed'),
  });

  function openEdit(cat) {
    setEditing(cat);
    setForm({ name: cat.name, description: cat.description || '', icon_name: cat.icon_name });
    setShowPicker(false);
    setModal('edit');
  }

  function openAdd() {
    setEditing(null);
    setForm({ name: '', description: '', icon_name: '⭐' });
    setShowPicker(false);
    setModal('add');
  }

  function openQuestions(cat) {
    setSelectedCat(cat);
    setModal('questions');
  }

  function handleSave(e) {
    e.preventDefault();
    if (editing) updateMut.mutate({ id: editing.id, data: form });
    else createMut.mutate(form);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Categories</h1>
          <p className="text-white/40 text-sm mt-1">{categories.length} categories</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Category
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(5)].map((_, i) => <div key={i} className="h-32 bg-white/5 rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map(cat => {
            const iconEmoji = resolveIcon(cat.icon_name);
            return (
              <div key={cat.id} className="card p-5 flex flex-col gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-brand-gradient flex items-center justify-center text-2xl flex-shrink-0">
                    {iconEmoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-white">{cat.name}</h3>
                      <div className="flex gap-1.5 flex-shrink-0">
                        <button onClick={() => openEdit(cat)} className="p-1.5 rounded-lg bg-white/5 hover:bg-brand-blue/20 text-white/40 hover:text-brand-blue transition-colors">
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => updateMut.mutate({ id: cat.id, data: { is_active: !cat.is_active } })}
                          className={`p-1.5 rounded-lg transition-colors ${cat.is_active ? 'bg-green-500/10 text-green-400 hover:bg-red-500/10 hover:text-red-400' : 'bg-white/5 text-white/30 hover:bg-green-500/10 hover:text-green-400'}`}
                        >
                          {cat.is_active ? <ToggleRight size={13} /> : <ToggleLeft size={13} />}
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-white/40 mt-0.5 truncate">{cat.description}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-brand-teal font-semibold">{cat.active_questions} active</span>
                      <span className="text-xs text-white/30">{cat.total_questions} total</span>
                      <span className={cat.is_active ? 'badge-active' : 'badge-inactive'}>{cat.is_active ? 'Active' : 'Inactive'}</span>
                    </div>
                  </div>
                </div>

                {/* View questions button */}
                <button
                  onClick={() => openQuestions(cat)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white/80 text-xs font-medium transition-colors border border-white/5"
                >
                  <span>View all questions</span>
                  <ChevronRight size={13} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit category modal */}
      <Modal open={modal === 'add' || modal === 'edit'} onClose={() => { setModal(null); setShowPicker(false); }} title={editing ? 'Edit Category' : 'Add Category'} size="sm">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm text-white/60 mb-1.5">Name *</label>
            <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="e.g. Science" />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1.5">Description</label>
            <input className="input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Short description" />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1.5">Icon</label>
            <button
              type="button"
              onClick={() => setShowPicker(p => !p)}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors w-full mb-2"
            >
              <span className="text-2xl">{resolveIcon(form.icon_name)}</span>
              <span className="text-sm text-white/50">
                {showPicker ? 'Close picker ↑' : 'Click to choose an icon ↓'}
              </span>
            </button>
            {showPicker && (
              <div className="flex justify-center">
                <EmojiPicker
                  onEmojiClick={e => { setForm(f => ({ ...f, icon_name: e.emoji })); setShowPicker(false); }}
                  theme="dark"
                  skinTonesDisabled
                  searchPlaceholder="Search emojis…"
                  width="100%"
                />
              </div>
            )}
          </div>
          <button type="submit" disabled={createMut.isPending || updateMut.isPending} className="btn-primary w-full">
            {createMut.isPending || updateMut.isPending ? 'Saving…' : (editing ? 'Update' : 'Create Category')}
          </button>
        </form>
      </Modal>

      {/* Questions drill-down modal */}
      <Modal
        open={modal === 'questions'}
        onClose={() => { setModal(null); setSelectedCat(null); }}
        title={`${selectedCat?.name || ''} — Questions`}
        size="lg"
      >
        {selectedCat && (
          <CategoryQuestionsModal
            cat={selectedCat}
            onClose={() => { setModal(null); setSelectedCat(null); }}
          />
        )}
      </Modal>
    </div>
  );
}
