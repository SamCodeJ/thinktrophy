import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { getWebhookLogs } from '../api';

export default function WebhookLogs() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['webhookLogs'],
    queryFn: getWebhookLogs,
  });

  const [selectedPayload, setSelectedPayload] = useState(null);

  const logs = data?.data || [];

  if (isLoading) return <div className="p-8 text-white/50">Loading webhook logs...</div>;
  if (isError) return <div className="p-8 text-red-400">Failed to load webhook logs.</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Webhook Logs</h1>
          <p className="text-white/60">Monitor incoming payment notifications from Flutterwave.</p>
        </div>
        <button
          onClick={() => refetch()}
          className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
        >
          Refresh Logs
        </button>
      </div>

      <div className="bg-[#1C1C1E] rounded-2xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="p-4 text-xs font-semibold text-white/40 uppercase tracking-wider">Date</th>
                <th className="p-4 text-xs font-semibold text-white/40 uppercase tracking-wider">Provider</th>
                <th className="p-4 text-xs font-semibold text-white/40 uppercase tracking-wider">Event Type</th>
                <th className="p-4 text-xs font-semibold text-white/40 uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-semibold text-white/40 uppercase tracking-wider">Error</th>
                <th className="p-4 text-xs font-semibold text-white/40 uppercase tracking-wider text-right">Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-white/40">
                    No webhooks received yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 whitespace-nowrap text-sm text-white/70">
                      {format(new Date(log.created_at), 'MMM d, yyyy HH:mm')}
                    </td>
                    <td className="p-4 whitespace-nowrap text-sm text-white capitalize">
                      {log.provider}
                    </td>
                    <td className="p-4 whitespace-nowrap text-sm text-white/80">
                      <span className="bg-white/5 px-2 py-1 rounded text-xs font-mono">
                        {log.event_type}
                      </span>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          log.status === 'processed'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : log.status === 'failed'
                            ? 'bg-red-500/10 text-red-400'
                            : 'bg-yellow-500/10 text-yellow-400'
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-red-400 max-w-[200px] truncate">
                      {log.error_message || '-'}
                    </td>
                    <td className="p-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => setSelectedPayload(log.payload)}
                        className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                      >
                        View JSON
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payload Modal */}
      {selectedPayload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1C1C1E] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h3 className="text-xl font-bold text-white">Webhook Payload</h3>
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
