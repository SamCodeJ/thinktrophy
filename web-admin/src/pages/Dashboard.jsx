import { useQuery } from '@tanstack/react-query';
import { getDashboardStats } from '../api';
import KPICard from '../components/KPICard';
import {
  Wallet, TrendingUp, TrendingDown, Users, Gamepad2, Zap,
} from 'lucide-react';
import { formatNaira as fmt, formatNairaAxis } from '../utils/formatNaira';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { format, parseISO } from 'date-fns';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-brand-card border border-white/10 rounded-xl p-3 shadow-xl">
      <p className="text-white/60 text-xs mb-2">{label}</p>
      {payload.map(p => (
        <p key={p.name} className="text-sm font-medium" style={{ color: p.color }}>
          {p.name}: {fmt(p.value)}
        </p>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboardStats,
    refetchInterval: 30_000,
  });

  const kpis = data?.data?.kpis || {};
  const daily = (data?.data?.dailyStats || []).map(d => ({
    ...d,
    date:    format(parseISO(d.date), 'MMM d'),
    staked:  parseFloat(d.staked),
    payouts: parseFloat(d.payouts),
  }));
  const perCat = data?.data?.gamesPerCategory || [];
  const recent = data?.data?.recentTransactions || [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="h-28 bg-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-white/40 text-sm mt-1">Platform overview — live stats</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Staked"     value={fmt(kpis.totalStaked)}  icon={Wallet}  color="blue"   gradient />
        <KPICard title="Total Payouts"    value={fmt(kpis.totalPayouts)} icon={TrendingDown} color="teal" />
        <KPICard title="Net Profit"       value={fmt(kpis.netProfit)}    icon={TrendingUp}  color="green" />
        <KPICard title="Total Users"      value={kpis.totalUsers?.toLocaleString() || 0} icon={Users} color="purple" />
        <KPICard title="Active Users"     value={kpis.activeUsers?.toLocaleString() || 0} icon={Users} color="teal" />
        <KPICard title="Games Today"      value={kpis.gamesToday || 0}   icon={Gamepad2}    color="yellow" />
        <KPICard title="Active Sessions"  value={kpis.activeSessions || 0} icon={Zap}       color="red" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue chart */}
        <div className="card p-5 lg:col-span-2">
          <h2 className="text-base font-semibold text-white mb-4">Revenue vs Payouts (30 days)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={daily}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: '#ffffff50', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#ffffff50', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={formatNairaAxis} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ color: '#ffffff80', fontSize: 12 }} />
              <Line type="monotone" dataKey="staked"  name="Staked"  stroke="#0984E3" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="payouts" name="Payouts" stroke="#00CEC9" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Category chart */}
        <div className="card p-5">
          <h2 className="text-base font-semibold text-white mb-4">Games per Category</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={perCat} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#ffffff50', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fill: '#ffffff80', fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="games_played" name="Games" fill="url(#barGrad)" radius={[0,4,4,0]} />
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#0984E3" />
                  <stop offset="100%" stopColor="#00CEC9" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent transactions */}
      <div className="card p-5">
        <h2 className="text-base font-semibold text-white mb-4">Recent Transactions</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                {['User', 'Type', 'Amount', 'Status', 'Date'].map(h => (
                  <th key={h} className="text-left px-3 py-2 text-white/40 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent.map(tx => (
                <tr key={tx.id} className="border-b border-white/5 hover:bg-white/3">
                  <td className="px-3 py-2.5 text-white/70">{tx.username}</td>
                  <td className="px-3 py-2.5">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      tx.type === 'deposit'    ? 'bg-green-500/20 text-green-400' :
                      tx.type === 'payout'     ? 'bg-brand-blue/20 text-brand-blue' :
                      tx.type === 'stake'      ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>{tx.type}</span>
                  </td>
                  <td className="px-3 py-2.5 text-white font-semibold">{fmt(tx.amount)}</td>
                  <td className="px-3 py-2.5">
                    <span className={`text-xs font-medium ${tx.status === 'verified' ? 'text-green-400' : 'text-yellow-400'}`}>
                      {tx.status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-white/40 text-xs">
                    {format(new Date(tx.created_at), 'MMM d, HH:mm')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
