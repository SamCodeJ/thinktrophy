import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { getGameSessions } from '../api';
import DataTable from '../components/DataTable';
import { format } from 'date-fns';

import { formatNaira as fmt } from '../utils/formatNaira';

export default function GameSessions() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({ status: '', page: 1, limit: 20 });

  const { data, isLoading } = useQuery({
    queryKey: ['game-sessions', filters],
    queryFn: () => getGameSessions(filters),
  });

  const columns = [
    { key: 'id',             header: 'ID',       render: v => <span className="text-white/50 font-mono text-xs uppercase">{v.substring(0, 8)}</span> },
    { key: 'username',       header: 'User',     render: v => <span className="font-medium text-white">{v}</span> },
    { key: 'stake_amount',   header: 'Stake',    render: v => <span className="font-bold text-yellow-400">{fmt(v)}</span> },
    { key: 'score',          header: 'Score',    render: v => (
      <span className={`font-bold text-lg ${v === 10 ? 'text-green-400' : v >= 9 ? 'text-brand-teal' : 'text-white/60'}`}>
        {v ?? '—'}/10
      </span>
    )},
    { key: 'payout_amount',  header: 'Payout',   render: v => <span className={`font-semibold ${parseFloat(v) > 0 ? 'text-green-400' : 'text-white/40'}`}>{fmt(v)}</span> },
    { key: 'status',         header: 'Status',   render: v => (
      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
        v === 'completed'   ? 'bg-green-500/20  text-green-400' :
        v === 'active'      ? 'bg-brand-blue/20 text-brand-blue' :
        v === 'expired'     ? 'bg-yellow-500/20 text-yellow-400' :
        v === 'invalidated' ? 'bg-red-500/20    text-red-400' :
        'bg-white/10 text-white/40'}`}>{v}</span>
    )},
    { key: 'duration_seconds', header: 'Duration', render: v => <span className="text-white/40">{v ? `${v}s` : '—'}</span> },
    { key: 'started_at',     header: 'Date',     render: v => <span className="text-white/40 text-xs">{v ? format(new Date(v), 'MMM d, HH:mm') : '—'}</span> },
    {
      key: 'actions', header: '', sortable: false, render: (_, row) => (
        <button onClick={() => navigate(`/game-sessions/${row.id}`)} className="p-1.5 rounded-lg bg-white/5 hover:bg-brand-blue/20 text-white/40 hover:text-brand-blue transition-colors">
          <Eye size={14} />
        </button>
      )
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Game Sessions</h1>
        <p className="text-white/40 text-sm mt-1">All platform game sessions</p>
      </div>

      <div className="card p-4">
        <select className="select w-48" value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value, page: 1 }))}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="expired">Expired</option>
          <option value="invalidated">Invalidated</option>
        </select>
      </div>

      <div className="card p-5">
        <DataTable
          columns={columns} data={data?.data} loading={isLoading}
          page={filters.page} setPage={p => setFilters(f => ({ ...f, page: p }))}
          total={data?.total}
          pageSize={filters.limit}
          onPageSizeChange={n => setFilters(f => ({ ...f, limit: n, page: 1 }))}
        />
      </div>
    </div>
  );
}
