import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Upload, Edit2, ToggleLeft, ToggleRight, Download, CheckCircle2, XCircle, AlertTriangle, Search, X, ShieldAlert } from 'lucide-react';
import { Document, Paragraph, TextRun, Packer } from 'docx';
import {
  getQuestions, createQuestion, updateQuestion, deleteQuestion, bulkDeleteQuestions,
  getAdminCategories, bulkUploadQuestions,
} from '../api';
import Modal from '../components/Modal';
import DataTable from '../components/DataTable';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';

const BLANK = { category_id: '', question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'a', difficulty: 'medium' };

function cleanQuestionParams(filters) {
  const params = {};
  if (filters.search?.trim()) params.search = filters.search.trim();
  if (filters.category_id) params.category_id = filters.category_id;
  if (filters.difficulty) params.difficulty = filters.difficulty;
  if (filters.status) params.status = filters.status;
  params.page = filters.page || 1;
  params.limit = filters.limit || 20;
  return params;
}

function QuestionForm({ initial, categories, onSave, loading }) {
  const [form, setForm] = useState(initial || BLANK);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-white/60 mb-1.5">Category *</label>
          <select className="select" value={form.category_id} onChange={e => set('category_id', e.target.value)} required>
            <option value="">Select category</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm text-white/60 mb-1.5">Difficulty *</label>
          <select className="select" value={form.difficulty} onChange={e => set('difficulty', e.target.value)}>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm text-white/60 mb-1.5">Question Text *</label>
        <textarea
          className="input resize-none h-20"
          placeholder="Enter question..."
          value={form.question_text}
          onChange={e => set('question_text', e.target.value)}
          required
        />
      </div>

      {['a','b','c','d'].map(opt => (
        <div key={opt} className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="correct"
              checked={form.correct_option === opt}
              onChange={() => set('correct_option', opt)}
              className="accent-brand-teal w-4 h-4"
            />
            <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold
              ${form.correct_option === opt ? 'bg-brand-gradient text-white' : 'bg-white/10 text-white/50'}`}>
              {opt.toUpperCase()}
            </span>
          </label>
          <input
            className="input flex-1"
            placeholder={`Option ${opt.toUpperCase()}`}
            value={form[`option_${opt}`]}
            onChange={e => set(`option_${opt}`, e.target.value)}
            required
          />
        </div>
      ))}

      <p className="text-xs text-white/30">Select the radio button next to the correct answer</p>

      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? 'Saving…' : (initial?.id ? 'Update Question' : 'Add Question')}
      </button>
    </form>
  );
}

export default function Questions() {
  const qc = useQueryClient();
  const { admin } = useAuth();
  const canEdit = admin?.role === 'super_admin' || admin?.role === 'moderator';

  const [filters, setFilters] = useState({ search: '', category_id: '', difficulty: '', status: '', page: 1, limit: 20 });
  const [searchInput, setSearchInput] = useState('');
  const [modal, setModal] = useState(null); // null | 'add' | 'edit' | 'bulk' | 'report'
  const [editing, setEditing] = useState(null);
  const [bulkFile, setBulkFile] = useState(null);
  const [uploadReport, setUploadReport] = useState(null); // { inserted, errors, filename }
  const [selectedIds, setSelectedIds] = useState(new Set());
  const searchTimer = useRef(null);

  // Live search: apply after a short pause while typing (also works with Enter / Search button)
  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      const next = searchInput.trim();
      setFilters(f => (f.search === next ? f : { ...f, search: next, page: 1 }));
    }, 350);
    return () => clearTimeout(searchTimer.current);
  }, [searchInput]);

  function applySearchNow() {
    clearTimeout(searchTimer.current);
    const next = searchInput.trim();
    setFilters(f => ({ ...f, search: next, page: 1 }));
  }

  const { data: catData } = useQuery({ queryKey: ['admin-categories'], queryFn: getAdminCategories });
  const categories = catData?.data || [];

  const { data, isLoading } = useQuery({
    queryKey: ['questions', filters],
    queryFn: () => getQuestions(cleanQuestionParams(filters)),
  });

  const createMut = useMutation({
    mutationFn: createQuestion,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['questions'] }); qc.invalidateQueries({ queryKey: ['admin-categories'] }); setModal(null); toast.success('Question added'); },
    onError: (e) => toast.error(e?.error?.message || 'Failed'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => updateQuestion(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['questions'] }); qc.invalidateQueries({ queryKey: ['admin-categories'] }); setModal(null); toast.success('Question updated'); },
    onError: (e) => toast.error(e?.error?.message || 'Failed'),
  });

  const statusMut = useMutation({
    mutationFn: ({ id, is_active }) => updateQuestion(id, { is_active }),
    onSuccess: (_, { is_active }) => {
      qc.invalidateQueries({ queryKey: ['questions'] });
      qc.invalidateQueries({ queryKey: ['admin-categories'] });
      toast.success(is_active ? 'Question activated' : 'Question deactivated');
    },
    onError: e => toast.error(e?.error?.message || 'Failed to update status'),
  });

  const deleteMut = useMutation({
    mutationFn: deleteQuestion,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['questions'] });
      qc.invalidateQueries({ queryKey: ['admin-categories'] });
      qc.invalidateQueries({ queryKey: ['category-questions'] });
      toast.success('Question deleted');
      setSelectedIds(new Set());
    },
    onError: (e) => toast.error(e?.error?.message || 'Failed to delete question'),
  });

  const bulkDeleteMut = useMutation({
    mutationFn: bulkDeleteQuestions,
    onSuccess: () => { 
      qc.invalidateQueries({ queryKey: ['questions'] });
      qc.invalidateQueries({ queryKey: ['admin-categories'] });
      qc.invalidateQueries({ queryKey: ['category-questions'] });
      toast.success('Questions deleted');
      setSelectedIds(new Set()); 
    },
    onError: (e) => toast.error(e?.error?.message || 'Failed to delete questions'),
  });

  function handleSelectAll(e) {
    if (e.target.checked && data?.data) {
      setSelectedIds(new Set(data.data.map(q => q.id)));
    } else {
      setSelectedIds(new Set());
    }
  }

  function handleSelectOne(id) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  }

  function handleBulkDelete() {
    if (selectedIds.size === 0) return;
    if (window.confirm(`Permanently delete ${selectedIds.size} questions? This cannot be undone.`)) {
      bulkDeleteMut.mutate(Array.from(selectedIds));
    }
  }

  const bulkMut = useMutation({
    mutationFn: ({ fd }) => bulkUploadQuestions(fd),
    onSuccess: (res, { filename }) => {
      qc.invalidateQueries({ queryKey: ['questions'] });
      qc.invalidateQueries({ queryKey: ['admin-categories'] });
      setUploadReport({ inserted: res.data.inserted, errors: res.data.errors || [], filename });
      setBulkFile(null);
      setModal('report');
    },
    onError: (e) => toast.error(e?.response?.data?.error?.message || e?.error?.message || 'Upload failed'),
  });

  async function downloadTemplate() {
    const makeQ = (num, question, a, b, c, d, correct) => [
      new Paragraph({ text: '' }),
      new Paragraph({
        children: [new TextRun({ text: `QUESTION ${num}. ${question}`, bold: false })],
      }),
      new Paragraph({ children: [new TextRun({ text: `A) ${a}` })] }),
      new Paragraph({ children: [new TextRun({ text: `B) ${b}` })] }),
      new Paragraph({ children: [new TextRun({ text: `C) ${c}` })] }),
      new Paragraph({ children: [new TextRun({ text: `D) ${d}` })] }),
      new Paragraph({ children: [new TextRun({ text: `Correct Answer: ${correct}`, bold: true })] }),
    ];

    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({
            children: [new TextRun({ text: 'CATEGORY: ENGLISH', bold: true, size: 28 })],
          }),
          new Paragraph({
            children: [new TextRun({ text: 'DIFFICULTY: HARD', bold: true, size: 28 })],
          }),
          new Paragraph({
            children: [new TextRun({ text: '(Replace ENGLISH with your category name, and HARD with easy / medium / hard)', italics: true, color: '888888', size: 20 })],
          }),
          ...makeQ(1,
            'Identify the grammatical error: "The group of scientists were determined to prove the hypothesis."',
            'Sentence is correct',
            'Subject-verb agreement ("were" should be "was")',
            'Punctuation (missing a semicolon)',
            'Incorrect preposition',
            'B'
          ),
          ...makeQ(2,
            'What is the meaning of the word "Anachronistic"?',
            'Belonging to a period other than that in which it exists',
            'A word that sounds like the noise it describes',
            'Having multiple meanings simultaneously',
            'Related to the study of ancient fossils',
            'A'
          ),
          new Paragraph({ text: '' }),
          new Paragraph({
            children: [new TextRun({ text: 'Instructions:', bold: true, underline: {} })],
          }),
          new Paragraph({ children: [new TextRun({ text: '• Each file must start with CATEGORY: and DIFFICULTY: headers.' })] }),
          new Paragraph({ children: [new TextRun({ text: '• The category name must match exactly what exists in the system.' })] }),
          new Paragraph({ children: [new TextRun({ text: '• Question numbers are ignored during import — they are for your reference only.' })] }),
          new Paragraph({ children: [new TextRun({ text: '• Correct Answer must be A, B, C, or D.' })] }),
          new Paragraph({ children: [new TextRun({ text: '• All four options (A–D) are required for every question.' })] }),
        ],
      }],
    });

    try {
      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'questions_template.docx';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to generate template');
    }
  }

  function downloadErrorReport(report) {
    const lines = [
      `Upload Report — ${report.filename}`,
      `Generated: ${new Date().toLocaleString()}`,
      `─────────────────────────────────────────`,
      `✅ Successfully imported: ${report.inserted}`,
      `❌ Failed: ${report.errors.length}`,
      `📊 Total in file: ${report.inserted + report.errors.length}`,
      ``,
      `Failed Questions:`,
      `─────────────────────────────────────────`,
      ...report.errors.map((e, i) => `${i + 1}. ${e}`),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `upload_error_report_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const columns = [
    {
      key: 'select',
      header: canEdit ? (
        <input 
          type="checkbox" 
          className="w-4 h-4 rounded bg-white/5 border-white/10"
          checked={data?.data?.length > 0 && selectedIds.size === data.data.length}
          onChange={handleSelectAll}
        />
      ) : null,
      sortable: false,
      render: (v, row) => canEdit ? (
        <input 
          type="checkbox" 
          className="w-4 h-4 rounded bg-white/5 border-white/10"
          checked={selectedIds.has(row.id)}
          onChange={() => handleSelectOne(row.id)}
        />
      ) : null,
    },
    { key: 'question_text', header: 'Question', render: v => <span className="max-w-xs truncate block" title={v}>{v}</span> },
    { key: 'category_name', header: 'Category', render: v => <span className="text-white/60">{v}</span> },
    { key: 'difficulty',    header: 'Difficulty', render: v => <span className={`badge-${v}`}>{v}</span> },
    { key: 'times_served',  header: 'Served', render: v => <span className="text-white/60">{v}</span> },
    { key: 'accuracy_pct',  header: 'Accuracy', render: v => <span className="text-brand-teal font-medium">{v}%</span> },
    { key: 'is_active',     header: 'Status', render: v => <span className={v ? 'badge-active' : 'badge-inactive'}>{v ? 'Active' : 'Inactive'}</span> },
    ...(canEdit ? [{
      key: 'id', header: 'Actions', sortable: false, render: (id, row) => (
        <div className="flex gap-2">
          <button
            onClick={() => { setEditing(row); setModal('edit'); }}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-brand-blue/20 text-white/50 hover:text-brand-blue transition-colors"
            title="Edit question"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={() => statusMut.mutate({ id, is_active: !row.is_active })}
            disabled={statusMut.isPending}
            title={row.is_active ? 'Deactivate question' : 'Activate question'}
            className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${
              row.is_active
                ? 'bg-green-500/10 text-green-400 hover:bg-red-500/15 hover:text-red-400'
                : 'bg-white/5 text-white/30 hover:bg-green-500/15 hover:text-green-400'
            }`}
          >
            {row.is_active ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
          </button>
          <button
            onClick={() => window.confirm('Permanently delete this question? This cannot be undone.') && deleteMut.mutate(id)}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-white/50 hover:text-red-400 transition-colors"
            title="Delete question"
          >
            <X size={14} />
          </button>
        </div>
      )
    }] : []),
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Questions</h1>
          <p className="text-white/40 text-sm mt-1">
            {filters.search
              ? `${data?.total || 0} result${(data?.total || 0) === 1 ? '' : 's'} for “${filters.search}”`
              : `${data?.total || 0} questions total`}
          </p>
        </div>
        <div className="flex gap-3">
          {canEdit && selectedIds.size > 0 && (
            <button onClick={handleBulkDelete} className="btn-secondary text-red-400 border-red-500/20 hover:bg-red-500/10">
              Delete Selected ({selectedIds.size})
            </button>
          )}
          {canEdit ? (
            <>
              <button onClick={() => setModal('bulk')} className="btn-secondary flex items-center gap-2">
                <Upload size={16} /> Bulk Upload
              </button>
              <button onClick={() => setModal('add')} className="btn-primary flex items-center gap-2">
                <Plus size={16} /> Add Question
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2 text-xs text-white/30 bg-white/5 px-3 py-1.5 rounded-lg">
              <ShieldAlert size={14} /> View Only
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 space-y-3">
        {/* Search bar */}
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
          <input
            className="input pl-9 pr-20"
            placeholder="Search by question text, option, or category…"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                applySearchNow();
              }
            }}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {searchInput && (
              <button
                onClick={() => { setSearchInput(''); setFilters(f => ({ ...f, search: '', page: 1 })); }}
                className="p-1 rounded-md text-white/30 hover:text-white/70 transition-colors"
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
            <button
              onClick={applySearchNow}
              className="px-2.5 py-1 rounded-lg bg-brand-blue/20 hover:bg-brand-blue/30 text-brand-blue text-xs font-medium transition-colors"
            >
              Search
            </button>
          </div>
        </div>

        {/* Active search badge */}
        {filters.search && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/40">Searching for:</span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-blue/15 border border-brand-blue/30 text-brand-blue text-xs font-medium">
              "{filters.search}"
              <button
                onClick={() => { setSearchInput(''); setFilters(f => ({ ...f, search: '', page: 1 })); }}
                className="hover:text-white transition-colors"
              >
                <X size={11} />
              </button>
            </span>
          </div>
        )}

        {/* Dropdown filters */}
        <div className="flex flex-wrap gap-3">
          <select className="select flex-1 min-w-36" value={filters.category_id} onChange={e => setFilters(f => ({ ...f, category_id: e.target.value, page: 1 }))}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select className="select flex-1 min-w-36" value={filters.difficulty} onChange={e => setFilters(f => ({ ...f, difficulty: e.target.value, page: 1 }))}>
            <option value="">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          <select className="select flex-1 min-w-36" value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value, page: 1 }))}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="card p-5">
        <DataTable
          columns={columns}
          data={data?.data}
          loading={isLoading}
          page={filters.page}
          setPage={p => setFilters(f => ({ ...f, page: p }))}
          total={data?.total}
          pageSize={filters.limit}
          onPageSizeChange={n => setFilters(f => ({ ...f, limit: n, page: 1 }))}
        />
      </div>

      {/* Add/Edit modal */}
      <Modal open={modal === 'add' || modal === 'edit'} onClose={() => setModal(null)} title={modal === 'edit' ? 'Edit Question' : 'Add Question'} size="md">
        <QuestionForm
          key={modal === 'edit' ? editing?.id || 'edit' : 'add'}
          initial={modal === 'edit' ? editing : null}
          categories={categories}
          loading={createMut.isPending || updateMut.isPending}
          onSave={form => {
            if (modal === 'edit') {
              const {
                category_id, question_text, option_a, option_b, option_c, option_d,
                correct_option, difficulty,
              } = form;
              updateMut.mutate({
                id: editing.id,
                data: {
                  category_id, question_text, option_a, option_b, option_c, option_d,
                  correct_option, difficulty,
                },
              });
            } else {
              createMut.mutate(form);
            }
          }}
        />
      </Modal>

      {/* Bulk upload modal */}
      <Modal open={modal === 'bulk'} onClose={() => { setModal(null); setBulkFile(null); }} title="Bulk Upload Questions" size="sm">
        <div className="space-y-5">
          {/* Template download */}
          <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-3">
            <p className="text-sm font-medium text-white/80">Step 1 — Download the template</p>
            <button onClick={downloadTemplate} className="btn-secondary flex items-center gap-2 text-sm">
              <Download size={14} /> Download Word Template (.docx)
            </button>
            <ul className="text-xs text-white/30 space-y-1 list-disc list-inside">
              <li>Start the file with <span className="text-white/50 font-mono">CATEGORY:</span> and <span className="text-white/50 font-mono">DIFFICULTY:</span> headers</li>
              <li>Category name must match exactly what exists in the system</li>
              <li>Difficulty must be <span className="text-white/50">easy</span>, <span className="text-white/50">medium</span>, or <span className="text-white/50">hard</span></li>
              <li>Each question needs options A–D and a <span className="text-white/50 font-mono">Correct Answer:</span> line</li>
              <li>Question numbers are ignored — they&apos;re for your reference only</li>
            </ul>
          </div>

          {/* File upload */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-white/80">Step 2 — Upload your file</p>
            <label className="block text-sm text-white/60 mb-2">Accepts .docx or .txt files</label>
            <input
              type="file"
              accept=".docx,.txt"
              onChange={e => setBulkFile(e.target.files[0])}
              className="block w-full text-sm text-white/50 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-brand-blue/20 file:text-brand-blue hover:file:bg-brand-blue/30 file:cursor-pointer"
            />
            {bulkFile && (
              <p className="text-xs text-white/40">Selected: <span className="text-white/60">{bulkFile.name}</span></p>
            )}
          </div>

          <button
            disabled={!bulkFile || bulkMut.isPending}
            onClick={() => {
              const fd = new FormData();
              fd.append('file', bulkFile);
              bulkMut.mutate({ fd, filename: bulkFile.name });
            }}
            className="btn-primary w-full"
          >
            {bulkMut.isPending ? 'Uploading…' : 'Upload & Import'}
          </button>
        </div>
      </Modal>

      {/* Upload report modal */}
      <Modal
        open={modal === 'report'}
        onClose={() => { setModal(null); setUploadReport(null); }}
        title="Upload Report"
        size="md"
      >
        {uploadReport && (
          <div className="space-y-5">
            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-3 text-center">
                <p className="text-2xl font-bold text-green-400">{uploadReport.inserted}</p>
                <p className="text-xs text-green-400/70 mt-0.5">Imported</p>
              </div>
              <div className={`rounded-xl border p-3 text-center ${uploadReport.errors.length > 0 ? 'bg-red-500/10 border-red-500/20' : 'bg-white/5 border-white/10'}`}>
                <p className={`text-2xl font-bold ${uploadReport.errors.length > 0 ? 'text-red-400' : 'text-white/30'}`}>{uploadReport.errors.length}</p>
                <p className={`text-xs mt-0.5 ${uploadReport.errors.length > 0 ? 'text-red-400/70' : 'text-white/25'}`}>Failed</p>
              </div>
              <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
                <p className="text-2xl font-bold text-white/70">{uploadReport.inserted + uploadReport.errors.length}</p>
                <p className="text-xs text-white/30 mt-0.5">Total in file</p>
              </div>
            </div>

            {/* Status banner */}
            {uploadReport.errors.length === 0 ? (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                <CheckCircle2 size={18} className="text-green-400 flex-shrink-0" />
                <p className="text-sm text-green-300">All questions imported successfully. No errors found.</p>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                <AlertTriangle size={18} className="text-yellow-400 flex-shrink-0" />
                <p className="text-sm text-yellow-300">
                  {uploadReport.errors.length} question{uploadReport.errors.length !== 1 ? 's' : ''} could not be imported. Review the errors below.
                </p>
              </div>
            )}

            {/* Error list */}
            {uploadReport.errors.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-white/70 flex items-center gap-2">
                    <XCircle size={14} className="text-red-400" /> Failed Questions
                  </p>
                  <button
                    onClick={() => downloadErrorReport(uploadReport)}
                    className="btn-secondary flex items-center gap-1.5 text-xs py-1.5 px-3"
                  >
                    <Download size={12} /> Download Report (.txt)
                  </button>
                </div>
                <div className="rounded-xl bg-black/30 border border-white/10 overflow-hidden">
                  <div className="max-h-64 overflow-y-auto divide-y divide-white/5">
                    {uploadReport.errors.map((err, i) => (
                      <div key={i} className="flex items-start gap-3 px-4 py-2.5">
                        <span className="text-xs text-white/25 font-mono mt-0.5 flex-shrink-0 w-5 text-right">{i + 1}</span>
                        <p className="text-xs text-red-300/80 leading-relaxed">{err}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-white/25 text-right">
                  Source file: <span className="text-white/40">{uploadReport.filename}</span>
                </p>
              </div>
            )}

            <button
              onClick={() => { setModal(null); setUploadReport(null); }}
              className="btn-primary w-full"
            >
              Done
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
