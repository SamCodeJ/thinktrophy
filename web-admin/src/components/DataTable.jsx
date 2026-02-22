import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

function getPageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = [1];
  if (current > 3) pages.push('…');
  for (let i = Math.max(2, current - 2); i <= Math.min(total - 1, current + 2); i++) {
    pages.push(i);
  }
  if (current < total - 2) pages.push('…');
  pages.push(total);
  return pages;
}

export default function DataTable({
  columns, data, loading,
  page, setPage,
  total,
  pageSize = 20, onPageSizeChange,
}) {
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  const sortedData = useMemo(() => {
    if (!sortKey || !data) return data;
    return [...data].sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp = (typeof av === 'number' && typeof bv === 'number')
        ? av - bv
        : String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: 'base' });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [data, sortKey, sortDir]);

  function handleSort(col) {
    if (col.sortable === false) return;
    if (sortKey === col.key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(col.key);
      setSortDir('asc');
    }
  }

  const count      = total ?? data?.length ?? 0;
  const totalPages = Math.ceil(count / pageSize);
  const fromRow    = count === 0 ? 0 : (page - 1) * pageSize + 1;
  const toRow      = Math.min(page * pageSize, count);

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(pageSize <= 10 ? pageSize : 5)].map((_, i) => (
          <div key={i} className="h-12 bg-white/5 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-white/5">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5">
              {columns.map(col => {
                const sortable = col.sortable !== false;
                const isActive = sortKey === col.key;
                return (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col)}
                    className={`text-left px-4 py-3 font-medium whitespace-nowrap select-none
                      ${sortable ? 'cursor-pointer group' : ''}
                      ${isActive ? 'text-white/70' : 'text-white/40'}
                    `}
                  >
                    <div className={`flex items-center gap-1.5 ${sortable ? 'hover:text-white/60' : ''}`}>
                      {col.header}
                      {sortable && (
                        <span className={`flex-shrink-0 transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}>
                          {isActive
                            ? sortDir === 'asc'
                              ? <ArrowUp size={12} />
                              : <ArrowDown size={12} />
                            : <ArrowUpDown size={12} />
                          }
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {(!sortedData || sortedData.length === 0) ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-12 text-white/30">
                  No records found
                </td>
              </tr>
            ) : sortedData.map((row, i) => (
              <tr
                key={row.id || i}
                className="border-b border-white/5 hover:bg-white/3 transition-colors"
              >
                {columns.map(col => (
                  <td key={col.key} className="px-4 py-3 text-white/70 whitespace-nowrap">
                    {col.render ? col.render(row[col.key], row) : row[col.key] ?? '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {count > 0 && (
        <div className="flex items-center justify-between mt-4 gap-3 flex-wrap">

          {/* Left: per-page selector + record range */}
          <div className="flex items-center gap-3 flex-wrap">
            {onPageSizeChange && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/40">Rows per page:</span>
                <select
                  value={pageSize}
                  onChange={e => onPageSizeChange(Number(e.target.value))}
                  className="bg-[#1E272E] border border-white/10 rounded-lg text-xs text-white
                             px-2 py-1.5 cursor-pointer focus:outline-none focus:ring-1
                             focus:ring-brand-blue/50"
                >
                  {PAGE_SIZE_OPTIONS.map(n => (
                    <option key={n} value={n} className="bg-[#1E272E] text-white">{n} per page</option>
                  ))}
                </select>
              </div>
            )}
            <span className="text-xs text-white/40">
              Showing {fromRow}–{toRow} of {count.toLocaleString()} records
            </span>
          </div>

          {/* Right: page navigation */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage(1)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="First page"
              >
                <ChevronsLeft size={14} />
              </button>
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Previous page"
              >
                <ChevronLeft size={14} />
              </button>

              {getPageNumbers(page, totalPages).map((p, i) =>
                p === '…' ? (
                  <span key={`ellipsis-${i}`} className="px-1 text-white/25 text-xs select-none">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`min-w-[30px] h-[30px] rounded-lg text-xs font-medium transition-colors
                      ${p === page
                        ? 'bg-brand-blue text-white shadow-sm shadow-brand-blue/40'
                        : 'bg-white/5 text-white/50 hover:bg-white/15 hover:text-white'
                      }`}
                  >
                    {p}
                  </button>
                )
              )}

              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Next page"
              >
                <ChevronRight size={14} />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(totalPages)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Last page"
              >
                <ChevronsRight size={14} />
              </button>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
