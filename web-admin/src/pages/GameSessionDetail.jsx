import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { getGameSessionDetail } from '../api';
import { format, differenceInSeconds } from 'date-fns';

const fmt = n => `₦${parseFloat(n || 0).toFixed(2)}`;

export default function GameSessionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({ queryKey: ['session', id], queryFn: () => getGameSessionDetail(id) });
  const session = data?.data;

  if (isLoading) return <div className="h-40 bg-white/5 rounded-2xl animate-pulse" />;
  if (!session) return <p className="text-white/40">Session not found</p>;

  const answers = session.answers_submitted || [];
  const duration = session.started_at && session.completed_at
    ? differenceInSeconds(new Date(session.completed_at), new Date(session.started_at))
    : null;

  return (
    <div className="space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm">
        <ArrowLeft size={16} /> Back
      </button>

      {/* Session header */}
      <div className="card p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-xl font-bold text-white">Session Details</h1>
            <p className="text-white/30 text-xs mt-1 font-mono">{session.id}</p>
            <div className="flex items-center gap-3 mt-3 flex-wrap">
              <span className="text-white/60">Player: <span className="text-white font-semibold">{session.username}</span></span>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                session.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                session.status === 'active'    ? 'bg-brand-blue/20 text-brand-blue' :
                'bg-yellow-500/20 text-yellow-400'}`}>{session.status}</span>
            </div>
          </div>
          <div className="flex gap-6">
            <div className="text-center">
              <p className="text-xs text-white/40">Stake</p>
              <p className="text-xl font-bold text-yellow-400">{fmt(session.stake_amount)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-white/40">Score</p>
              <p className={`text-3xl font-black ${session.score === 10 ? 'text-green-400' : session.score >= 9 ? 'text-brand-teal' : 'text-white/60'}`}>
                {session.score ?? '—'}<span className="text-base text-white/30">/10</span>
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-white/40">Payout</p>
              <p className={`text-xl font-bold ${parseFloat(session.payout_amount) > 0 ? 'text-green-400' : 'text-white/40'}`}>{fmt(session.payout_amount)}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-5 border-t border-white/5">
          <div>
            <p className="text-xs text-white/40">Started</p>
            <p className="text-sm text-white mt-0.5">{session.started_at ? format(new Date(session.started_at), 'MMM d, yyyy HH:mm:ss') : '—'}</p>
          </div>
          <div>
            <p className="text-xs text-white/40">Completed</p>
            <p className="text-sm text-white mt-0.5">{session.completed_at ? format(new Date(session.completed_at), 'MMM d, yyyy HH:mm:ss') : '—'}</p>
          </div>
          <div>
            <p className="text-xs text-white/40">Duration</p>
            <p className="text-sm text-white mt-0.5">{duration !== null ? `${duration}s` : '—'}</p>
          </div>
          <div>
            <p className="text-xs text-white/40">Active Track</p>
            <p className="text-sm text-white mt-0.5 capitalize">{session.active_track === 'a' ? 'Hard (Perfect first 5)' : 'Normal'}</p>
          </div>
        </div>
      </div>

      {/* Answers */}
      {answers.length > 0 && (
        <div className="card p-5">
          <h2 className="text-base font-semibold text-white mb-4">Answer Submissions ({answers.length})</h2>
          <div className="space-y-2">
            {answers.map((a, i) => (
              <div key={i} className={`flex items-center gap-4 p-3 rounded-xl ${a.is_correct ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                <span className="text-white/40 text-sm font-medium w-6">Q{i + 1}</span>
                {a.is_correct ? <CheckCircle size={16} className="text-green-400 flex-shrink-0" /> : <XCircle size={16} className="text-red-400 flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white/50 font-mono truncate">{a.question_id}</p>
                  <p className="text-sm text-white/70 mt-0.5">Answered: <span className="font-semibold text-white uppercase">{a.chosen_option}</span></p>
                </div>
                <p className="text-xs text-white/30">{a.submitted_at ? format(new Date(a.submitted_at), 'HH:mm:ss') : ''}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
