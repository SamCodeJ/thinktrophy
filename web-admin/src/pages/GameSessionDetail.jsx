import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, RefreshCw, ShieldAlert } from 'lucide-react';
import { getGameSessionDetail, correctGameSessionAnswer } from '../api';
import { format, differenceInSeconds } from 'date-fns';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { formatNaira as fmt } from '../utils/formatNaira';

export default function GameSessionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { admin } = useAuth();
  const canCorrect = admin?.role === 'super_admin' || admin?.role === 'moderator';

  const { data, isLoading } = useQuery({
    queryKey: ['session', id],
    queryFn: () => getGameSessionDetail(id),
  });
  const session = data?.data;

  const correctMut = useMutation({
    mutationFn: ({ question_id, is_correct }) =>
      correctGameSessionAnswer(id, { question_id, is_correct }),
    onSuccess: (res) => {
      qc.invalidateQueries(['session', id]);
      qc.invalidateQueries(['game-sessions']);
      const d = res?.data;
      const delta = parseFloat(d?.walletCreditDelta || 0);
      const scoreLine = `${d?.previous?.score}/10 → ${d?.corrected?.score}/10`;
      if (delta > 0) {
        toast.success(`Grade updated (${scoreLine}). Credited ${fmt(delta)} net to wallet.`);
      } else if (delta < 0) {
        toast.success(`Grade updated (${scoreLine}). Reversed ${fmt(Math.abs(delta))} from wallet.`);
      } else {
        toast.success(`Grade updated (${scoreLine}). No payout change.`);
      }
    },
    onError: (e) => toast.error(e?.error?.message || 'Correction failed'),
  });

  if (isLoading) return <div className="h-40 bg-white/5 rounded-2xl animate-pulse" />;
  if (!session) return <p className="text-white/40">Session not found</p>;

  const answers = session.answer_review?.length
    ? session.answer_review
    : (session.answers_submitted || []).map((a, i) => ({
        index: i + 1,
        ...a,
        question_text: null,
        correct_option: null,
        options: null,
      }));

  const duration = session.started_at && session.completed_at
    ? differenceInSeconds(new Date(session.completed_at), new Date(session.started_at))
    : null;

  const gross = parseFloat(session.payout_amount) || 0;
  const tax = parseFloat(session.tax_amount) || 0;
  const net = session.net_payout != null ? parseFloat(session.net_payout) : Math.round((gross - tax) * 100) / 100;
  const isCompleted = session.status === 'completed';

  function handleFlip(answer) {
    const nextCorrect = !answer.is_correct;
    const action = nextCorrect ? 'CORRECT' : 'INCORRECT';
    const ok = window.confirm(
      `Mark Q${answer.index} as ${action}?\n\n` +
      `Score and payout will be recalculated. If the player is owed more (9/10 or 10/10), ` +
      `their wallet will be credited after the 5% win tax, and Zoho will be updated.\n\n` +
      `Question: ${(answer.question_text || answer.question_id || '').slice(0, 120)}`
    );
    if (!ok) return;
    correctMut.mutate({ question_id: answer.question_id, is_correct: nextCorrect });
  }

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
            <p className="text-white/40 text-xs mt-1 font-mono uppercase">ID: <span className="text-white/60">{session.id}</span></p>
            <div className="flex items-center gap-3 mt-3 flex-wrap">
              <span className="text-white/60">Player: <span className="text-white font-semibold">{session.username}</span></span>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                session.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                session.status === 'active'    ? 'bg-brand-blue/20 text-brand-blue' :
                'bg-yellow-500/20 text-yellow-400'}`}>{session.status}</span>
            </div>
          </div>
          <div className="flex gap-6 flex-wrap">
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
              <p className="text-xs text-white/40">Gross Payout</p>
              <p className={`text-xl font-bold ${gross > 0 ? 'text-green-400' : 'text-white/40'}`}>{fmt(gross)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-white/40">Tax</p>
              <p className="text-xl font-bold text-white/50">{fmt(tax)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-white/40">Net Credited</p>
              <p className={`text-xl font-bold ${net > 0 ? 'text-brand-teal' : 'text-white/40'}`}>{fmt(net)}</p>
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

      {/* Dispute correction banner — visible on every completed past session */}
      {isCompleted && (
        <div className="rounded-2xl border border-brand-blue/30 bg-brand-blue/10 p-4 flex gap-3 items-start">
          <RefreshCw size={18} className="text-brand-blue flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">Dispute grade correction</p>
            <p className="text-xs text-white/50 mt-1 leading-relaxed">
              If a player disputes wrong grading, flip the answer below to Correct or Incorrect.
              Score and payout recalculate automatically. Any additional 9/10 or 10/10 winnings
              (after 5% tax) are credited to their wallet and synced to Zoho Books.
            </p>
          </div>
          {!canCorrect && (
            <div className="flex items-center gap-1.5 text-xs text-white/30 bg-white/5 px-2.5 py-1 rounded-lg flex-shrink-0">
              <ShieldAlert size={12} /> View only
            </div>
          )}
        </div>
      )}

      {/* Answers */}
      {answers.length > 0 && (
        <div className="card p-5">
          <h2 className="text-base font-semibold text-white mb-4">Answer Submissions ({answers.length})</h2>
          <div className="space-y-3">
            {answers.map((a) => (
              <div
                key={`${a.question_id}-${a.index}`}
                className={`p-4 rounded-xl ${a.is_correct ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-white/40 text-sm font-medium w-8 pt-0.5">Q{a.index}</span>
                  {a.is_correct
                    ? <CheckCircle size={16} className="text-green-400 flex-shrink-0 mt-0.5" />
                    : <XCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium leading-snug">
                      {a.question_text || <span className="font-mono text-xs text-white/40">{a.question_id}</span>}
                    </p>
                    <p className="text-sm text-white/70 mt-1.5">
                      Answered:{' '}
                      <span className="font-semibold text-white uppercase">{a.chosen_option}</span>
                      {a.options?.[a.chosen_option] && (
                        <span className="text-white/50"> — {a.options[a.chosen_option]}</span>
                      )}
                    </p>
                    {a.correct_option && (
                      <p className="text-xs text-white/40 mt-1">
                        Official correct: <span className="uppercase font-semibold text-white/60">{a.correct_option}</span>
                        {a.options?.[a.correct_option] && ` — ${a.options[a.correct_option]}`}
                      </p>
                    )}
                    {a.corrected_at && (
                      <p className="text-xs text-brand-blue mt-1">
                        Corrected {format(new Date(a.corrected_at), 'MMM d, yyyy HH:mm')}
                        {typeof a.previous_is_correct === 'boolean' && (
                          <> (was {a.previous_is_correct ? 'correct' : 'incorrect'})</>
                        )}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <p className="text-xs text-white/30">
                      {a.submitted_at ? format(new Date(a.submitted_at), 'HH:mm:ss') : ''}
                    </p>
                    {isCompleted && canCorrect && (
                      <button
                        type="button"
                        disabled={correctMut.isPending}
                        onClick={() => handleFlip(a)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${
                          a.is_correct
                            ? 'bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/30'
                            : 'bg-green-500/15 text-green-400 hover:bg-green-500/25 border border-green-500/30'
                        }`}
                      >
                        {correctMut.isPending ? 'Saving…' : a.is_correct ? 'Mark Incorrect' : 'Mark Correct'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {answers.length === 0 && (
        <div className="card p-5">
          <p className="text-white/40 text-sm">No answers were submitted for this session.</p>
        </div>
      )}
    </div>
  );
}
