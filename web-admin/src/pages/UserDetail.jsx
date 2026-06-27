import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, UserCheck, UserX, ChevronLeft, ChevronRight } from 'lucide-react';
import { getUserDetail, updateUserStatus } from '../api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

import { formatNaira as fmt } from '../utils/formatNaira';
const PAGE_SIZE_OPTIONS = [10, 15, 25, 50];

function MiniPagination({ page, setPage, total, pageSize, setPageSize }) {
  const totalPages = Math.ceil(total / pageSize);
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to   = Math.min(page * pageSize, total);

  if (total === 0) return null;

  return (
    <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5 gap-3 flex-wrap">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/30">Per page:</span>
          <select
            value={pageSize}
            onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
            className="bg-[#1E272E] border border-white/10 rounded-lg text-xs text-white
                       px-2 py-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-brand-blue/50"
          >
            {PAGE_SIZE_OPTIONS.map(n => <option key={n} value={n} className="bg-[#1E272E] text-white">{n} per page</option>)}
          </select>
        </div>
        <span className="text-xs text-white/30">{from}–{to} of {total}</span>
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
  );
}

export default function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [sessionPage, setSessionPage]         = useState(1);
  const [sessionPageSize, setSessionPageSize] = useState(15);
  const [txPage, setTxPage]                   = useState(1);
  const [txPageSize, setTxPageSize]           = useState(15);

  const { data, isLoading } = useQuery({ queryKey: ['user', id], queryFn: () => getUserDetail(id) });
  const user         = data?.data?.user;
  const allSessions  = data?.data?.sessions     || [];
  const allTx        = data?.data?.transactions || [];

  const sessions = useMemo(() => {
    const start = (sessionPage - 1) * sessionPageSize;
    return allSessions.slice(start, start + sessionPageSize);
  }, [allSessions, sessionPage, sessionPageSize]);

  const transactions = useMemo(() => {
    const start = (txPage - 1) * txPageSize;
    return allTx.slice(start, start + txPageSize);
  }, [allTx, txPage, txPageSize]);

  const statusMut = useMutation({
    mutationFn: ({ is_active }) => updateUserStatus(id, { is_active }),
    onSuccess: () => { qc.invalidateQueries(['user', id]); toast.success('Status updated'); },
  });

  if (isLoading) return (
    <div className="space-y-4">
      <div className="h-8 w-32 bg-white/5 rounded-xl animate-pulse" />
      <div className="h-40 bg-white/5 rounded-2xl animate-pulse" />
    </div>
  );
  if (!user) return <p className="text-white/40">User not found</p>;

  return (
    <div className="space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm">
        <ArrowLeft size={16} /> Back to Users
      </button>

      {/* Profile card */}
      <div className="card p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-brand-gradient flex items-center justify-center text-xl font-bold text-white">
              {user.username[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{user.username}</h1>
              <p className="text-white/40 text-sm">{user.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={user.is_active ? 'badge-active' : 'badge-inactive'}>
                  {user.is_active ? 'Active' : 'Inactive'}
                </span>
                <span className="text-xs text-white/30">Joined {format(new Date(user.created_at), 'MMM d, yyyy')}</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => statusMut.mutate({ is_active: !user.is_active })}
            className={`btn-secondary flex items-center gap-2 text-sm ${!user.is_active ? 'text-green-400' : 'text-red-400'}`}
          >
            {user.is_active ? <><UserX size={14} /> Deactivate</> : <><UserCheck size={14} /> Activate</>}
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {[
            { label: 'Wallet Balance', value: fmt(user.wallet_balance), color: 'text-brand-teal' },
            { label: 'Total Staked',   value: fmt(user.total_staked),   color: 'text-yellow-400' },
            { label: 'Total Won',      value: fmt(user.total_won),      color: 'text-green-400' },
            { label: 'Games Played',   value: user.total_games_played,  color: 'text-brand-blue' },
          ].map(s => (
            <div key={s.label} className="bg-white/5 rounded-xl p-4">
              <p className="text-xs text-white/40">{s.label}</p>
              <p className={`text-lg font-bold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Sessions */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-white">Game History</h2>
          {allSessions.length > 0 && (
            <span className="text-xs text-white/30">{allSessions.length} total sessions</span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                {['Stake', 'Score', 'Payout', 'Status', 'Duration', 'Date'].map(h => (
                  <th key={h} className="text-left px-3 py-2 text-white/40 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sessions.map(s => (
                <tr key={s.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                  <td className="px-3 py-2.5 text-white font-semibold">{fmt(s.stake_amount)}</td>
                  <td className="px-3 py-2.5">
                    <span className={`font-bold ${s.score === 10 ? 'text-green-400' : s.score >= 9 ? 'text-brand-teal' : 'text-white/60'}`}>
                      {s.score}/10
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-green-400 font-semibold">{fmt(s.payout_amount)}</td>
                  <td className="px-3 py-2.5">
                    <span className={`text-xs font-medium ${
                      s.status === 'completed' ? 'text-green-400' :
                      s.status === 'active'    ? 'text-brand-blue' :
                      s.status === 'expired'   ? 'text-yellow-400' : 'text-red-400'}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-white/40">{s.duration_seconds ? `${s.duration_seconds}s` : '—'}</td>
                  <td className="px-3 py-2.5 text-white/40 text-xs">{s.started_at ? format(new Date(s.started_at), 'MMM d, HH:mm') : '—'}</td>
                </tr>
              ))}
              {sessions.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-white/30">No games yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <MiniPagination page={sessionPage} setPage={setSessionPage} total={allSessions.length} pageSize={sessionPageSize} setPageSize={setSessionPageSize} />
      </div>

      {/* Transactions */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-white">Transaction History</h2>
          {allTx.length > 0 && (
            <span className="text-xs text-white/30">{allTx.length} total transactions</span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                {['Type', 'Amount', 'Status', 'Reference', 'Date'].map(h => (
                  <th key={h} className="text-left px-3 py-2 text-white/40 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transactions.map(tx => (
                <tr key={tx.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                  <td className="px-3 py-2.5">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      tx.type === 'deposit' ? 'bg-green-500/20 text-green-400' :
                      tx.type === 'payout'  ? 'bg-brand-blue/20 text-brand-blue' :
                      tx.type === 'stake'   ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'}`}>{tx.type}</span>
                  </td>
                  <td className="px-3 py-2.5 font-bold text-white">{fmt(tx.amount)}</td>
                  <td className="px-3 py-2.5 text-xs text-white/60">{tx.status}</td>
                  <td className="px-3 py-2.5 font-mono text-xs text-white/30">{tx.reference || '—'}</td>
                  <td className="px-3 py-2.5 text-xs text-white/40">{format(new Date(tx.created_at), 'MMM d, HH:mm')}</td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr><td colSpan={5} className="text-center py-8 text-white/30">No transactions</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <MiniPagination page={txPage} setPage={setTxPage} total={allTx.length} pageSize={txPageSize} setPageSize={setTxPageSize} />
      </div>
    </div>
  );
}
