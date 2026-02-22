import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search, Eye, UserCheck, UserX } from 'lucide-react';
import { getUsers, updateUserStatus } from '../api';
import DataTable from '../components/DataTable';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const fmt = n => `₦${parseFloat(n || 0).toFixed(2)}`;

export default function Users() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [filters, setFilters] = useState({ search: '', page: 1, limit: 20 });
  const [searchInput, setSearchInput] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['users', filters],
    queryFn: () => getUsers(filters),
  });

  const statusMut = useMutation({
    mutationFn: ({ id, is_active }) => updateUserStatus(id, { is_active }),
    onSuccess: () => { qc.invalidateQueries(['users']); toast.success('User status updated'); },
    onError: e => toast.error(e?.error?.message || 'Failed'),
  });

  const columns = [
    { key: 'username',           header: 'Username',   render: v => <span className="font-medium text-white">{v}</span> },
    { key: 'email',              header: 'Email',       render: v => <span className="text-white/60">{v}</span> },
    { key: 'wallet_balance',     header: 'Balance',     render: v => <span className="font-bold text-brand-teal">{fmt(v)}</span> },
    { key: 'total_games_played', header: 'Games',       render: v => <span className="text-white/60">{v}</span> },
    { key: 'total_won',          header: 'Total Won',   render: v => <span className="text-green-400 font-semibold">{fmt(v)}</span> },
    { key: 'is_active',          header: 'Status',      render: v => <span className={v ? 'badge-active' : 'badge-inactive'}>{v ? 'Active' : 'Inactive'}</span> },
    { key: 'created_at',         header: 'Joined',      render: v => <span className="text-white/40 text-xs">{format(new Date(v), 'MMM d, yyyy')}</span> },
    {
      key: 'id', header: 'Actions', sortable: false, render: (id, row) => (
        <div className="flex gap-2">
          <button onClick={() => navigate(`/users/${id}`)} className="p-1.5 rounded-lg bg-white/5 hover:bg-brand-blue/20 text-white/40 hover:text-brand-blue transition-colors">
            <Eye size={14} />
          </button>
          <button
            onClick={() => statusMut.mutate({ id, is_active: !row.is_active })}
            className={`p-1.5 rounded-lg transition-colors ${row.is_active ? 'bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400' : 'bg-white/5 hover:bg-green-500/20 text-white/40 hover:text-green-400'}`}
          >
            {row.is_active ? <UserX size={14} /> : <UserCheck size={14} />}
          </button>
        </div>
      )
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Users</h1>
        <p className="text-white/40 text-sm mt-1">{data?.total || 0} registered users</p>
      </div>

      <div className="card p-4">
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            className="input pl-9"
            placeholder="Search by username or email…"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && setFilters(f => ({ ...f, search: searchInput, page: 1 }))}
          />
        </div>
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
