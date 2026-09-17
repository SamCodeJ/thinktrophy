import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTransactions, verifyDepositTransaction } from '../api';
import DataTable from '../components/DataTable';
import { format } from 'date-fns';
import { formatNaira as fmt } from '../utils/formatNaira';
import toast from 'react-hot-toast';

export default function Transactions() {
  const qc = useQueryClient();
  const [filters, setFilters] = useState({ type: '', status: '', from: '', to: '', page: 1, limit: 20 });

  const { data, isLoading } = useQuery({
    queryKey: ['transactions', filters],
    queryFn: () => getTransactions(filters),
  });

  const verifyMut = useMutation({
    mutationFn: ({ id, flwId }) => verifyDepositTransaction(id, flwId),
    onSuccess: (res) => {
      const credited = parseFloat(res?.data?.credited);
      toast.success(
        Number.isFinite(credited) && credited > 0
          ? `Wallet credited ${fmt(credited)}`
          : 'Deposit already matches Flutterwave'
      );
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (e, vars) => {
      toast.error(e?.error?.message || 'Verification failed');
      if (e?.error?.code === 'VERIFICATION_FAILED' && !vars?.flwId) {
        const pasted = window.prompt(
          'Flutterwave did not find this payment reference. Paste the numeric Transaction ID from the Flutterwave dashboard (or cancel).'
        );
        if (pasted && pasted.trim()) {
          verifyMut.mutate({ id: vars.id, flwId: pasted.trim() });
        }
      }
    },
  });

  const transactions = data?.data || [];
  const summary = data?.summary || {};

  const columns = [
    { key: 'username', header: 'User', render: v => <span className="font-medium text-white">{v}</span> },
    { key: 'type',     header: 'Type', render: v => (
      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
        v === 'deposit'    ? 'bg-green-500/20 text-green-400' :
        v === 'payout'     ? 'bg-brand-blue/20 text-brand-blue' :
        v === 'stake'      ? 'bg-yellow-500/20 text-yellow-400' :
        'bg-red-500/20 text-red-400'}`}>{v}</span>
    )},
    { key: 'amount',    header: 'Amount', render: v => <span className="font-bold text-white">{fmt(v)}</span> },
    { key: 'status',    header: 'Status', render: v => (
      <span className={`text-xs font-medium ${
        v === 'verified' ? 'text-green-400' :
        v === 'pending'  ? 'text-yellow-400' :
        v === 'failed'   ? 'text-red-400' : 'text-white/40'}`}>{v}</span>
    )},
    { key: 'reference', header: 'Reference', render: v => <span className="text-xs font-mono text-white/40">{v || '—'}</span> },
    { key: 'created_at', header: 'Date', render: v => <span className="text-white/40 text-xs">{format(new Date(v), 'MMM d, yyyy HH:mm')}</span> },
    {
      key: 'actions',
      header: '',
      sortable: false,
      render: (_v, row) => {
        const isThisRow = verifyMut.isPending && verifyMut.variables?.id === row.id;
        const canReconcile = row.type === 'deposit' && row.reference &&
          (row.status === 'pending' || row.status === 'verified');
        if (!canReconcile) return null;
        const isPending = row.status === 'pending';
        return (
          <button
            type="button"
            disabled={isThisRow}
            onClick={() => verifyMut.mutate({ id: row.id })}
            className={`text-xs font-semibold px-2.5 py-1 rounded-lg disabled:opacity-50 ${
              isPending
                ? 'bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            {isThisRow ? 'Verifying…' : isPending ? 'Verify' : 'Reconcile'}
          </button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Transactions</h1>
        <p className="text-white/40 text-sm mt-1">Full transaction ledger</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Deposited', value: fmt(summary.total_deposited), color: 'text-green-400' },
          { label: 'Total Staked',    value: fmt(summary.total_staked),    color: 'text-yellow-400' },
          { label: 'Total Paid Out',  value: fmt(summary.total_paid_out),  color: 'text-brand-blue' },
          { label: 'Total Withdrawn', value: fmt(summary.total_withdrawn), color: 'text-red-400' },
        ].map(s => (
          <div key={s.label} className="card p-4">
            <p className="text-xs text-white/40">{s.label}</p>
            <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <select className="select flex-1 min-w-32" value={filters.type} onChange={e => setFilters(f => ({ ...f, type: e.target.value, page: 1 }))}>
          <option value="">All Types</option>
          <option value="deposit">Deposit</option>
          <option value="stake">Stake</option>
          <option value="payout">Payout</option>
          <option value="withdrawal">Withdrawal</option>
        </select>
        <select className="select flex-1 min-w-32" value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value, page: 1 }))}>
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="failed">Failed</option>
          <option value="reversed">Reversed</option>
        </select>
        <input type="date" className="input flex-1 min-w-36" value={filters.from} onChange={e => setFilters(f => ({ ...f, from: e.target.value, page: 1 }))} />
        <input type="date" className="input flex-1 min-w-36" value={filters.to} onChange={e => setFilters(f => ({ ...f, to: e.target.value, page: 1 }))} />
      </div>

      <div className="card p-5">
        <DataTable
          columns={columns} data={transactions} loading={isLoading}
          page={filters.page} setPage={p => setFilters(f => ({ ...f, page: p }))}
          total={data?.total}
          pageSize={filters.limit}
          onPageSizeChange={n => setFilters(f => ({ ...f, limit: n, page: 1 }))}
        />
      </div>
    </div>
  );
}
