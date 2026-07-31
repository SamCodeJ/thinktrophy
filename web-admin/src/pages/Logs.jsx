import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAdminLogs } from '../api';
import DataTable from '../components/DataTable';
import { format } from 'date-fns';

export default function Logs() {
  const [filters, setFilters] = useState({ page: 1, limit: 50, action: '', entity: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-logs', filters],
    queryFn: () => getAdminLogs(filters),
  });

  const columns = [
    { 
      key: 'created_at', 
      header: 'Date & Time', 
      render: v => <span className="text-white/60 whitespace-nowrap">{format(new Date(v), 'MMM d, yyyy HH:mm')}</span> 
    },
    { 
      key: 'admin_name', 
      header: 'Admin', 
      render: (v, row) => (
        <div>
          <p className="font-medium text-white/90">{v || 'System'}</p>
          {row.admin_email && <p className="text-xs text-white/40">{row.admin_email}</p>}
        </div>
      )
    },
    { 
      key: 'action', 
      header: 'Action', 
      render: v => (
        <span className="px-2 py-1 rounded bg-brand-blue/10 text-brand-blue border border-brand-blue/20 text-xs font-semibold">
          {v}
        </span>
      )
    },
    { 
      key: 'entity', 
      header: 'Entity', 
      render: v => <span className="text-white/70 capitalize">{v}</span> 
    },
    { 
      key: 'details', 
      header: 'Details', 
      sortable: false,
      render: v => {
        let displayValue = v;
        if (typeof v === 'string') {
          try {
            displayValue = JSON.parse(v);
          } catch (e) {
            // keep as string if not valid JSON
          }
        }

        if (!displayValue) return <span className="text-white/40">—</span>;

        // If it's an object, render it as clean key-value pairs
        if (typeof displayValue === 'object' && !Array.isArray(displayValue)) {
          return (
            <div className="max-w-md max-h-28 overflow-auto pr-2 flex flex-col gap-1.5">
              {Object.entries(displayValue).map(([key, value]) => {
                // Format key: "game_duration" -> "Game Duration"
                const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                
                // Format value nicely
                let formattedValue = value;
                if (typeof value === 'boolean') formattedValue = value ? 'Yes' : 'No';
                else if (value === null || value === undefined) formattedValue = '—';
                else if (typeof value === 'object') formattedValue = JSON.stringify(value);

                return (
                  <div key={key} className="flex items-start text-xs">
                    <span className="text-white/40 font-medium min-w-[110px] shrink-0">{formattedKey}:</span>
                    <span className="text-white/80 break-words">{String(formattedValue)}</span>
                  </div>
                );
              })}
            </div>
          );
        }

        // Fallback for simple strings or arrays
        return (
          <div className="max-w-md max-h-24 overflow-auto pr-2 text-xs text-white/70 whitespace-pre-wrap">
            {String(displayValue)}
          </div>
        );
      }
    },
    { 
      key: 'ip_address', 
      header: 'IP Address', 
      render: v => <span className="text-white/40 font-mono text-xs">{v || '—'}</span> 
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Activity Logs</h1>
          <p className="text-white/40 text-sm mt-1">Track actions performed by administrators</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <select 
          className="select flex-1 min-w-40" 
          value={filters.action} 
          onChange={e => setFilters(f => ({ ...f, action: e.target.value, page: 1 }))}
        >
          <option value="">All Actions</option>
          <option value="CREATE_QUESTION">Create Question</option>
          <option value="UPDATE_QUESTION">Update Question</option>
          <option value="DELETE_QUESTION">Delete Question</option>
          <option value="BULK_UPLOAD_QUESTIONS">Bulk Upload Questions</option>
          <option value="BULK_DELETE_QUESTIONS">Bulk Delete Questions</option>
          <option value="CREATE_CATEGORY">Create Category</option>
          <option value="UPDATE_CATEGORY">Update Category</option>
          <option value="DELETE_CATEGORY">Delete Category</option>
          <option value="BULK_DELETE_CATEGORIES">Bulk Delete Categories</option>
          <option value="UPDATE_USER_STATUS">Update User Status</option>
          <option value="UPDATE_SETTINGS">Update Settings</option>
        </select>

        <select 
          className="select flex-1 min-w-40" 
          value={filters.entity} 
          onChange={e => setFilters(f => ({ ...f, entity: e.target.value, page: 1 }))}
        >
          <option value="">All Entities</option>
          <option value="question">Question</option>
          <option value="category">Category</option>
          <option value="user">User</option>
          <option value="settings">Settings</option>
        </select>

        {(filters.action || filters.entity) && (
          <button 
            onClick={() => setFilters({ page: 1, limit: 50, action: '', entity: '' })}
            className="btn-secondary px-4 text-xs h-[42px]"
          >
            Clear Filters
          </button>
        )}
      </div>

      <div className="card p-5">
        <DataTable
          columns={columns}
          data={data?.data}
          loading={isLoading}
          page={filters.page}
          setPage={p => setFilters(f => ({ ...f, page: p }))}
          total={data?.total}
          pageSize={filters.limit}
          onPageSizeChange={n => setFilters(f => ({ ...f, limit: n, page: 1 }))}
        />
      </div>
    </div>
  );
}