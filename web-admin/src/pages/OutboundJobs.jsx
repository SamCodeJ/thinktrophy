import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { getOutboundJobs, retryOutboundJob } from '../api';

const STATUS_STYLES = {
  sent: 'bg-emerald-500/10 text-emerald-400',
  pending: 'bg-yellow-500/10 text-yellow-400',
  processing: 'bg-blue-500/10 text-blue-400',
  failed: 'bg-red-500/10 text-red-400',
};

export default function OutboundJobs() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ page: 1, limit: 50, kind: '', status: '' });
  const [selectedPayload, setSelectedPayload] = useState(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['outbound-jobs', filters],
    queryFn: () => getOutboundJobs(filters),
  });

  const retry = useMutation({
    mutationFn: retryOutboundJob,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['outbound-jobs'] }),
  });

  const jobs = data?.data || [];
  const summary = data?.summary || {};

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Delivery queue</h1>
          <p className="text-white/60">
            Zoho Books journals and emails. Failed items retry automatically, or send again here.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          ['Pending', summary.pending],
          ['Failed', summary.failed],
          ['Emails waiting', summary.email_open],
          ['Zoho waiting', summary.zoho_open],
        ].map(([label, value]) => (
          <div key={label} className="bg-[#1C1C1E] border border-white/5 rounded-2xl px-4 py-3">
            <p className="text-xs text-white/40">{label}</p>
            <p className="text-2xl font-semibold text-white mt-1">{value ?? 0}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-3 mb-4">
        <select
          value={filters.kind}
          onChange={(e) => setFilters((f) => ({ ...f, kind: e.target.value, page: 1 }))}
          className="bg-[#1C1C1E] border border-white/10 text-white text-sm rounded-xl px-3 py-2"
        >
          <option value="">All kinds</option>
          <option value="email">Email</option>
          <option value="zoho">Zoho</option>
        </select>
        <select
          value={filters.status}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value, page: 1 }))}
          className="bg-[#1C1C1E] border border-white/10 text-white text-sm rounded-xl px-3 py-2"
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="sent">Sent</option>
          <option value="processing">Processing</option>
        </select>
      </div>

      {isLoading && <div className="p-8 text-white/50">Loading delivery jobs...</div>}
      {isError && <div className="p-8 text-red-400">Failed to load delivery jobs.</div>}

      {!isLoading && !isError && (
        <div className="bg-[#1C1C1E] rounded-2xl border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  <th className="p-4 text-xs font-semibold text-white/40 uppercase tracking-wider">Date</th>
                  <th className="p-4 text-xs font-semibold text-white/40 uppercase tracking-wider">Kind</th>
                  <th className="p-4 text-xs font-semibold text-white/40 uppercase tracking-wider">Job</th>
                  <th className="p-4 text-xs font-semibold text-white/40 uppercase tracking-wider">To / ref</th>
                  <th className="p-4 text-xs font-semibold text-white/40 uppercase tracking-wider">Status</th>
                  <th className="p-4 text-xs font-semibold text-white/40 uppercase tracking-wider">Attempts</th>
                  <th className="p-4 text-xs font-semibold text-white/40 uppercase tracking-wider">Error</th>
                  <th className="p-4 text-xs font-semibold text-white/40 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {jobs.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-8 text-center text-white/40">
                      No outbound jobs yet.
                    </td>
                  </tr>
                ) : (
                  jobs.map((job) => (
                    <tr key={job.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-4 whitespace-nowrap text-sm text-white/70">
                        {format(new Date(job.created_at), 'MMM d, yyyy HH:mm')}
                      </td>
                      <td className="p-4 whitespace-nowrap text-sm text-white capitalize">{job.kind}</td>
                      <td className="p-4 whitespace-nowrap text-sm text-white/80">
                        <span className="bg-white/5 px-2 py-1 rounded text-xs font-mono">{job.job_name}</span>
                      </td>
                      <td className="p-4 text-sm text-white/70 max-w-[180px] truncate">
                        {job.payload?.to || job.idempotency_key || '—'}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[job.status] || 'bg-white/10 text-white/60'}`}>
                          {job.status}
                        </span>
                      </td>
                      <td className="p-4 whitespace-nowrap text-sm text-white/60">
                        {job.attempts}/{job.max_attempts}
                      </td>
                      <td className="p-4 text-sm text-red-400 max-w-[200px] truncate">
                        {job.last_error || '—'}
                      </td>
                      <td className="p-4 whitespace-nowrap text-right space-x-3">
                        <button
                          onClick={() => setSelectedPayload(job.payload)}
                          className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                        >
                          View
                        </button>
                        {(job.status === 'failed' || job.status === 'pending') && (
                          <button
                            onClick={() => retry.mutate(job.id)}
                            className="text-emerald-400 hover:text-emerald-300 text-sm font-medium"
                          >
                            Retry
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedPayload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1C1C1E] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h3 className="text-xl font-bold text-white">Job payload</h3>
              <button
                onClick={() => setSelectedPayload(null)}
                className="text-white/50 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <pre className="bg-black/50 p-4 rounded-xl text-sm text-emerald-400 font-mono overflow-x-auto">
                {JSON.stringify(selectedPayload, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
