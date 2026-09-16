import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Monitor, ShieldAlert } from 'lucide-react';
import { getSettings, updateSettings } from '../api';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';

export default function Settings() {
  const qc = useQueryClient();
  const { admin } = useAuth();
  const canEdit = admin?.role === 'super_admin' || admin?.role === 'moderator';
  const canEditEconomy = admin?.role === 'super_admin';

  const { data, isLoading } = useQuery({ queryKey: ['settings'], queryFn: getSettings });
  const [form, setForm] = useState({
    min_stake: '', max_stake: '', payout_perfect: '',
    payout_nine: '', game_duration: '', platform_name: '', platform_tagline: '',
    kiosk_mode: false, kiosk_warning_count: 1, referral_win_percentage: '', user_win_tax_percentage: '',
  });

  useEffect(() => {
    if (data?.data) {
      const s = data.data;
      setForm({
        min_stake:            s.min_stake            || '200',
        max_stake:            s.max_stake            || '50000',
        payout_perfect:       s.payout_perfect       || '2.0',
        payout_nine:          s.payout_nine          || '0.5',
        game_duration:        s.game_duration        || '60',
        platform_name:        s.platform_name        || 'ThinkTrophy',
        platform_tagline:     s.platform_tagline     || 'Think Sharp. Win Big.',
        kiosk_mode:           s.kiosk_mode === 'true',
        kiosk_warning_count:  parseInt(s.kiosk_warning_count || '1', 10),
        referral_win_percentage: s.referral_win_percentage || '0.10',
        user_win_tax_percentage: s.user_win_tax_percentage || '0.05',
      });
    }
  }, [data]);

  const saveMut = useMutation({
    mutationFn: () => {
      const payload = {
        game_duration:       parseInt(form.game_duration, 10),
        platform_name:       form.platform_name,
        platform_tagline:    form.platform_tagline,
        kiosk_mode:          form.kiosk_mode,
        kiosk_warning_count: parseInt(form.kiosk_warning_count, 10),
      };
      if (canEditEconomy) {
        payload.min_stake = parseFloat(form.min_stake);
        payload.max_stake = parseFloat(form.max_stake);
        payload.payout_perfect = parseFloat(form.payout_perfect);
        payload.payout_nine = parseFloat(form.payout_nine);
        payload.referral_win_percentage = parseFloat(form.referral_win_percentage);
        payload.user_win_tax_percentage = parseFloat(form.user_win_tax_percentage);
      }
      return updateSettings(payload);
    },
    onSuccess: () => { qc.invalidateQueries(['settings']); toast.success('Settings saved'); },
    onError: e => toast.error(e?.error?.message || 'Failed to save'),
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  if (isLoading) return <div className="h-40 bg-white/5 rounded-2xl animate-pulse" />;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Platform Settings</h1>
        <p className="text-white/40 text-sm mt-1">Configure game rules and platform details</p>
      </div>

      <div className="card p-6 space-y-6">
        {/* Staking */}
        <div>
          <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">Staking Limits</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/60 mb-1.5">Minimum Stake (₦)</label>
              <input className="input" type="number" min="0.01" step="0.01" value={form.min_stake} onChange={e => set('min_stake', e.target.value)} disabled={!canEditEconomy} />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1.5">Maximum Stake (₦)</label>
              <input className="input" type="number" min="1" step="1" value={form.max_stake} onChange={e => set('max_stake', e.target.value)} disabled={!canEditEconomy} />
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 pt-6">
          <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">Payout Multipliers</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/60 mb-1.5">10/10 Perfect Score Multiplier</label>
              <input className="input" type="number" min="0" step="0.1" value={form.payout_perfect} onChange={e => set('payout_perfect', e.target.value)} disabled={!canEditEconomy} />
              <p className="text-xs text-white/30 mt-1">Player wins stake × {form.payout_perfect}</p>
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1.5">9/10 Score Multiplier</label>
              <input className="input" type="number" min="0" step="0.1" value={form.payout_nine} onChange={e => set('payout_nine', e.target.value)} disabled={!canEditEconomy} />
              <p className="text-xs text-white/30 mt-1">Player wins stake × {form.payout_nine}</p>
            </div>
          </div>
          <div className="mt-4 p-3 bg-brand-blue/10 rounded-xl border border-brand-blue/20">
            <p className="text-xs text-brand-blue/80">
              ℹ️ Scores of 8/10 or below result in a full stake loss with no payout.
            </p>
          </div>
        </div>

        <div className="border-t border-white/5 pt-6">
          <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">Game Session</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-white/60 mb-1.5">Game Duration (Seconds)</label>
              <input className="input" type="number" min="10" step="1" value={form.game_duration} onChange={e => set('game_duration', e.target.value)} />
              <p className="text-xs text-white/30 mt-1">How much total time the player has to complete all 10 questions</p>
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 pt-6">
          <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">Taxes & Referrals</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/60 mb-1.5">User Win Tax (UWT)</label>
              <input className="input" type="number" min="0" step="0.01" max="1" value={form.user_win_tax_percentage} onChange={e => set('user_win_tax_percentage', e.target.value)} disabled={!canEditEconomy} />
              <p className="text-xs text-white/30 mt-1">Percentage of winnings deducted as tax for 10/10 and 9/10 (e.g. 0.05 for 5%). The original stake is not taxed.</p>
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1.5">Referral Win Percentage</label>
              <input className="input" type="number" min="0" step="0.01" max="1" value={form.referral_win_percentage} onChange={e => set('referral_win_percentage', e.target.value)} disabled={!canEditEconomy} />
              <p className="text-xs text-white/30 mt-1">Percentage of a player's first profit that goes to their referrer (e.g., 0.10 for 10%)</p>
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 pt-6">
          <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">Platform Branding</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-white/60 mb-1.5">Platform Name</label>
              <input className="input" value={form.platform_name} onChange={e => set('platform_name', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1.5">Tagline</label>
              <input className="input" value={form.platform_tagline} onChange={e => set('platform_tagline', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Kiosk Mode */}
        <div className="border-t border-white/5 pt-6">
          <div className="flex items-center gap-2 mb-1">
            <Monitor size={15} className="text-white/60" />
            <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Kiosk Mode</h2>
          </div>
          <p className="text-xs text-white/30 mb-4">
            Monitors the game for app-switching. If a player backgrounds the app too many times during
            a game, the session is automatically abandoned and their stake is lost.
          </p>

          {/* Master toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 mb-4">
            <div>
              <p className="text-sm font-semibold text-white">Enable Kiosk Mode</p>
              <p className="text-xs text-white/40 mt-0.5">Restricts the app to kiosk operation on mobile devices</p>
            </div>
            <button
              type="button"
              onClick={() => set('kiosk_mode', !form.kiosk_mode)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                form.kiosk_mode ? 'bg-brand-blue' : 'bg-white/20'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  form.kiosk_mode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Warning count */}
            {form.kiosk_mode && (
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <label className="block text-sm text-white/60 mb-1.5">
                Warnings Before Game Ends
              </label>
              <input
                className="input w-24"
                type="number"
                min="1"
                max="10"
                value={form.kiosk_warning_count}
                onChange={e => set('kiosk_warning_count', e.target.value)}
              />
              <p className="text-xs text-white/30 mt-1.5">
                A player receives this many warnings for closing the app mid-game.
                On the <strong className="text-white/50">{(parseInt(form.kiosk_warning_count, 10) + 1) || 2}nd</strong> close
                the game session is automatically abandoned and their stake is lost.
              </p>
            </div>
          )}

          {form.kiosk_mode && (
            <div className="mt-3 p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
              <p className="text-xs text-amber-400/80">
                ⚠️ Kiosk mode is <strong>active</strong>. Players who background the app during a game
                will receive up to <strong>{form.kiosk_warning_count}</strong> warning(s) before their
                session is force-ended and stake is forfeited.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center pt-2">
          {!canEdit && (
            <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-400/10 px-3 py-2 rounded-lg border border-amber-400/20">
              <ShieldAlert size={14} /> You have viewer access only. Settings cannot be saved.
            </div>
          )}
          {canEdit && !canEditEconomy && (
            <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-400/10 px-3 py-2 rounded-lg border border-amber-400/20">
              <ShieldAlert size={14} /> Stake, payout, and tax settings can only be changed by a super admin.
            </div>
          )}
          <button
            onClick={() => saveMut.mutate()}
            disabled={saveMut.isPending || !canEdit}
            className={`btn-primary flex items-center gap-2 ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Save size={16} />
            {saveMut.isPending ? 'Saving…' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
