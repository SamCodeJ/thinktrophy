import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getStatistics } from '../api';
import KPICard from '../components/KPICard';
import {
  DollarSign, TrendingUp, TrendingDown, Users, Gamepad2,
  HelpCircle, Target, Clock, Award, BarChart2, ArrowUpRight,
  CheckCircle, XCircle, AlertCircle, Wallet,
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, AreaChart, Area,
} from 'recharts';
import { format, parseISO } from 'date-fns';

const fmt   = (n) => `₦${parseFloat(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
const fmtSm = (n) => `₦${parseFloat(n || 0).toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
const pct   = (n) => `${parseFloat(n || 0).toFixed(1)}%`;

const PERIODS = [
  { label: '7 Days',   value: '7d' },
  { label: '30 Days',  value: '30d' },
  { label: '90 Days',  value: '90d' },
  { label: 'All Time', value: 'all' },
];

const PIE_COLORS = ['#0984E3', '#00CEC9', '#6C5CE7', '#FDCB6E', '#E17055', '#55EFC4'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-brand-card border border-white/10 rounded-xl p-3 shadow-xl">
      <p className="text-white/60 text-xs mb-2">{label}</p>
      {payload.map(p => (
        <p key={p.name} className="text-sm font-medium" style={{ color: p.color }}>
          {p.name}:{' '}
          {typeof p.value === 'number' && p.name.toLowerCase().includes('user')
            ? p.value
            : fmtSm(p.value)}
        </p>
      ))}
    </div>
  );
};

const UserTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-brand-card border border-white/10 rounded-xl p-3 shadow-xl">
      <p className="text-white/60 text-xs mb-2">{label}</p>
      {payload.map(p => (
        <p key={p.name} className="text-sm font-medium" style={{ color: p.color }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

function SectionTitle({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="p-2 rounded-xl bg-brand-blue/10">
        <Icon size={18} className="text-brand-blue" />
      </div>
      <div>
        <h2 className="text-base font-semibold text-white">{title}</h2>
        {subtitle && <p className="text-xs text-white/40">{subtitle}</p>}
      </div>
    </div>
  );
}

function SkeletonGrid({ count = 4 }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="h-28 bg-white/5 rounded-2xl animate-pulse" />
      ))}
    </div>
  );
}

export default function Statistics() {
  const [period, setPeriod] = useState('30d');

  const { data, isLoading } = useQuery({
    queryKey: ['statistics', period],
    queryFn: () => getStatistics(period),
    staleTime: 60_000,
  });

  const stats     = data?.data || {};
  const fin       = stats.financial   || {};
  const usr       = stats.users       || {};
  const gm        = stats.games       || {};
  const qs        = stats.questions   || {};
  const topUsers  = stats.topUsers    || [];
  const topQs     = stats.topQuestions || [];

  const dailyRev = (stats.dailyRevenue || []).map(d => ({
    ...d,
    date:     format(parseISO(d.date), 'MMM d'),
    staked:   parseFloat(d.staked),
    payouts:  parseFloat(d.payouts),
    deposits: parseFloat(d.deposits),
  }));

  const dailyUsrs = (stats.dailyUsers || []).map(d => ({
    date:      format(parseISO(d.date), 'MMM d'),
    new_users: parseInt(d.new_users),
  }));

  const perCat = (stats.gamesPerCategory || []).map(c => ({
    ...c,
    games_played:  parseInt(c.games_played),
    total_staked:  parseFloat(c.total_staked),
  }));

  const sessionPieData = gm.total_sessions > 0 ? [
    { name: 'Completed',       value: gm.completed       || 0 },
    { name: 'Expired',         value: gm.expired         || 0 },
    { name: 'Active',          value: gm.active          || 0 },
    { name: 'Pending Payment', value: gm.pending_payment || 0 },
    { name: 'Invalidated',     value: gm.invalidated     || 0 },
  ].filter(d => d.value > 0) : [];

  const txPieData = [
    { name: 'Stakes',      value: fin.stake_count      || 0 },
    { name: 'Payouts',     value: fin.payout_count     || 0 },
    { name: 'Deposits',    value: fin.deposit_count    || 0 },
    { name: 'Withdrawals', value: fin.withdrawal_count || 0 },
  ].filter(d => d.value > 0);

  const qDiffData = [
    { name: 'Easy',   value: qs.easy_count   || 0, fill: '#00b894' },
    { name: 'Medium', value: qs.medium_count || 0, fill: '#fdcb6e' },
    { name: 'Hard',   value: qs.hard_count   || 0, fill: '#e17055' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Statistics</h1>
          <p className="text-white/40 text-sm mt-1">In-depth platform analytics</p>
        </div>
        <div className="flex gap-1 bg-white/5 rounded-xl p-1">
          {PERIODS.map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                period === p.value
                  ? 'bg-brand-gradient text-white shadow'
                  : 'text-white/40 hover:text-white'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Financial Overview ─────────────────────────────────── */}
      <section>
        <SectionTitle icon={DollarSign} title="Financial Overview" subtitle="Revenue, payouts and deposits" />
        {isLoading ? <SkeletonGrid count={4} /> : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <KPICard title="Total Staked"    value={fmt(fin.total_staked)}    icon={DollarSign}   color="blue" gradient />
              <KPICard title="Total Payouts"   value={fmt(fin.total_payouts)}   icon={TrendingDown} color="teal" />
              <KPICard title="Net Profit"      value={fmt(fin.netProfit)}       icon={TrendingUp}   color="green" />
              <KPICard title="Profit Margin"   value={`${fin.profitMargin || 0}%`} icon={Target}    color="purple" />
              <KPICard title="Total Deposits"  value={fmt(fin.total_deposits)}  icon={ArrowUpRight} color="teal" />
              <KPICard title="Total Withdrawals" value={fmt(fin.total_withdrawals)} icon={Wallet}   color="yellow" />
              <KPICard title="Pending Txns"    value={fin.pending_count || 0}   icon={AlertCircle}  color="yellow" />
              <KPICard title="Failed Txns"     value={fin.failed_count  || 0}   icon={XCircle}      color="red" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="card p-5 lg:col-span-2">
                <h3 className="text-sm font-semibold text-white mb-4">Daily Revenue Breakdown</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={dailyRev}>
                    <defs>
                      <linearGradient id="gStaked"   x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#0984E3" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#0984E3" stopOpacity={0}   />
                      </linearGradient>
                      <linearGradient id="gPayouts"  x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#00CEC9" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#00CEC9" stopOpacity={0}   />
                      </linearGradient>
                      <linearGradient id="gDeposits" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#6C5CE7" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6C5CE7" stopOpacity={0}   />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" tick={{ fill: '#ffffff50', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#ffffff50', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₦${v}`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ color: '#ffffff80', fontSize: 12 }} />
                    <Area type="monotone" dataKey="staked"   name="Staked"   stroke="#0984E3" fill="url(#gStaked)"   strokeWidth={2} dot={false} />
                    <Area type="monotone" dataKey="payouts"  name="Payouts"  stroke="#00CEC9" fill="url(#gPayouts)"  strokeWidth={2} dot={false} />
                    <Area type="monotone" dataKey="deposits" name="Deposits" stroke="#6C5CE7" fill="url(#gDeposits)" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="card p-5">
                <h3 className="text-sm font-semibold text-white mb-4">Transaction Volume by Type</h3>
                {txPieData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie data={txPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                          {txPieData.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ background: '#232F38', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2 mt-2">
                      {txPieData.map((item, i) => (
                        <div key={item.name} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                            <span className="text-white/60">{item.name}</span>
                          </div>
                          <span className="text-white font-medium">{item.value.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-white/30 text-sm text-center mt-10">No transaction data</p>
                )}
              </div>
            </div>
          </>
        )}
      </section>

      {/* ── User Analytics ─────────────────────────────────────── */}
      <section>
        <SectionTitle icon={Users} title="User Analytics" subtitle="Registration trends and engagement" />
        {isLoading ? <SkeletonGrid count={4} /> : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <KPICard title="Total Users"      value={usr.total_users?.toLocaleString() || 0}  icon={Users}        color="blue" gradient />
              <KPICard title="Active Users"     value={usr.active_users?.toLocaleString() || 0} icon={CheckCircle}  color="green" />
              <KPICard title="Inactive Users"   value={usr.inactive_users?.toLocaleString() || 0} icon={XCircle}    color="red" />
              <KPICard title="New (Last 7d)"    value={usr.new_last_7d || 0}                     icon={ArrowUpRight} color="teal" />
              <KPICard title="New (Last 30d)"   value={usr.new_last_30d || 0}                    icon={ArrowUpRight} color="purple" />
              <KPICard title="Avg Games/User"   value={usr.avg_games_per_user || 0}              icon={Gamepad2}     color="yellow" />
              <KPICard title="Avg Wallet Bal."  value={fmt(usr.avg_wallet_balance)}              icon={Wallet}       color="teal" />
              <KPICard title="Total Wallet Bal." value={fmt(usr.total_wallet_balance)}           icon={DollarSign}   color="blue" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="card p-5 lg:col-span-2">
                <h3 className="text-sm font-semibold text-white mb-4">New User Registrations</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={dailyUsrs}>
                    <defs>
                      <linearGradient id="gUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#6C5CE7" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#6C5CE7" stopOpacity={0}   />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date"      tick={{ fill: '#ffffff50', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="new_users" tick={{ fill: '#ffffff50', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<UserTooltip />} />
                    <Area type="monotone" dataKey="new_users" name="New Users" stroke="#6C5CE7" fill="url(#gUsers)" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="card p-5">
                <h3 className="text-sm font-semibold text-white mb-4">Top 10 Players by Winnings</h3>
                <div className="space-y-2 overflow-y-auto max-h-[210px] pr-1">
                  {topUsers.length > 0 ? topUsers.map((u, i) => (
                    <div key={u.username} className="flex items-center gap-3 py-1.5">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        i === 0 ? 'bg-yellow-400/20 text-yellow-400' :
                        i === 1 ? 'bg-white/10 text-white/60' :
                        i === 2 ? 'bg-orange-400/20 text-orange-400' :
                        'bg-white/5 text-white/30'
                      }`}>{i + 1}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-white truncate">{u.username}</p>
                        <p className="text-xs text-white/40">{u.total_games_played} games</p>
                      </div>
                      <span className="text-xs font-semibold text-green-400 flex-shrink-0">{fmt(u.total_won)}</span>
                    </div>
                  )) : (
                    <p className="text-white/30 text-sm text-center mt-6">No user data</p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </section>

      {/* ── Game Analytics ─────────────────────────────────────── */}
      <section>
        <SectionTitle icon={Gamepad2} title="Game Analytics" subtitle="Session stats and category performance" />
        {isLoading ? <SkeletonGrid count={4} /> : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <KPICard title="Total Sessions"   value={gm.total_sessions?.toLocaleString() || 0} icon={Gamepad2}    color="blue" gradient />
              <KPICard title="Completed"        value={gm.completed?.toLocaleString() || 0}       icon={CheckCircle} color="green" />
              <KPICard title="Completion Rate"  value={`${gm.completionRate || 0}%`}              icon={Target}      color="teal" />
              <KPICard title="Active Now"       value={gm.active || 0}                            icon={Gamepad2}    color="yellow" />
              <KPICard title="Avg Score"        value={gm.avg_score || 0}                         icon={Award}       color="purple" />
              <KPICard title="Avg Stake"        value={fmt(gm.avg_stake)}                         icon={DollarSign}  color="blue" />
              <KPICard title="Avg Payout"       value={fmt(gm.avg_payout)}                        icon={TrendingUp}  color="green" />
              <KPICard title="Avg Duration"     value={gm.avg_duration_seconds ? `${Math.round(gm.avg_duration_seconds / 60)}m` : '—'} icon={Clock} color="teal" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="card p-5">
                <h3 className="text-sm font-semibold text-white mb-4">Session Status Breakdown</h3>
                {sessionPieData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie data={sessionPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                          {sessionPieData.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ background: '#232F38', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2 mt-2">
                      {sessionPieData.map((item, i) => (
                        <div key={item.name} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                            <span className="text-white/60">{item.name}</span>
                          </div>
                          <span className="text-white font-medium">{item.value.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-white/30 text-sm text-center mt-10">No session data</p>
                )}
              </div>

              <div className="card p-5 lg:col-span-2">
                <h3 className="text-sm font-semibold text-white mb-4">Games &amp; Stakes per Category</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={perCat} layout="vertical" margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                    <XAxis type="number" tick={{ fill: '#ffffff50', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="name" type="category" tick={{ fill: '#ffffff80', fontSize: 11 }} axisLine={false} tickLine={false} width={90} />
                    <Tooltip contentStyle={{ background: '#232F38', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', fontSize: 12 }} />
                    <Legend wrapperStyle={{ color: '#ffffff80', fontSize: 12 }} />
                    <Bar dataKey="games_played" name="Games" fill="url(#catGrad)" radius={[0, 4, 4, 0]} />
                    <defs>
                      <linearGradient id="catGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%"   stopColor="#0984E3" />
                        <stop offset="100%" stopColor="#00CEC9" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </section>

      {/* ── Question Health ────────────────────────────────────── */}
      <section>
        <SectionTitle icon={HelpCircle} title="Question Health" subtitle="Question bank quality and engagement" />
        {isLoading ? <SkeletonGrid count={4} /> : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <KPICard title="Total Questions"   value={qs.total_questions?.toLocaleString() || 0}  icon={HelpCircle}  color="blue" gradient />
              <KPICard title="Active Questions"  value={qs.active_questions?.toLocaleString() || 0} icon={CheckCircle} color="green" />
              <KPICard title="Times Served"      value={qs.total_times_served?.toLocaleString() || 0} icon={BarChart2}  color="teal" />
              <KPICard title="Avg Accuracy"      value={pct(qs.avg_accuracy)}                        icon={Target}      color="purple" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="card p-5">
                <h3 className="text-sm font-semibold text-white mb-4">Questions by Difficulty</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={qDiffData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" tick={{ fill: '#ffffff80', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#ffffff50', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: '#232F38', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', fontSize: 12 }} />
                    <Bar dataKey="value" name="Questions" radius={[6, 6, 0, 0]}>
                      {qDiffData.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="flex justify-around mt-3">
                  {qDiffData.map(d => (
                    <div key={d.name} className="text-center">
                      <p className="text-lg font-bold text-white">{d.value}</p>
                      <p className="text-xs" style={{ color: d.fill }}>{d.name}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card p-5 lg:col-span-2">
                <h3 className="text-sm font-semibold text-white mb-4">Most Served Questions</h3>
                <div className="space-y-2 overflow-y-auto max-h-[260px] pr-1">
                  {topQs.length > 0 ? topQs.map((q, i) => (
                    <div key={i} className="flex items-center gap-3 py-1.5 border-b border-white/5 last:border-0">
                      <span className="text-xs text-white/30 w-5 flex-shrink-0 text-center">{i + 1}</span>
                      <p className="text-xs text-white/70 flex-1 line-clamp-2 leading-snug">{q.question_text}</p>
                      <div className="flex flex-col items-end flex-shrink-0 gap-0.5">
                        <span className="text-xs text-white/50">{q.times_served} served</span>
                        <span className={`text-xs font-semibold ${
                          parseFloat(q.accuracy_pct) >= 60 ? 'text-green-400' :
                          parseFloat(q.accuracy_pct) >= 40 ? 'text-yellow-400' : 'text-red-400'
                        }`}>{pct(q.accuracy_pct)}</span>
                      </div>
                    </div>
                  )) : (
                    <p className="text-white/30 text-sm text-center mt-6">No question data yet</p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
