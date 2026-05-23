import React from 'react';

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  className?: string;
}

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50],
  className,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  function range() {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('...');
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
        pages.push(i);
      }
      if (page < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  }

  const pages = range();

  return (
    <div className={`flex items-center justify-between gap-4 flex-wrap ${className ?? ''}`}>
      {/* Summary */}
      <span className="text-xs" style={{ color: 'var(--color-solar-text-muted)' }}>
        {from}–{to} of {total.toLocaleString()}
      </span>

      {/* Page size */}
      {onPageSizeChange && (
        <div className="flex items-center gap-1.5">
          <span className="text-xs" style={{ color: 'var(--color-solar-text-muted)' }}>Show</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="text-xs rounded px-1.5 py-1"
            style={{
              background: 'var(--color-solar-card)',
              color: 'var(--color-solar-text-secondary)',
              border: '1px solid var(--color-solar-border)',
            }}
          >
            {pageSizeOptions.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      )}

      {/* Pages */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="px-2 py-1 text-xs rounded transition-colors disabled:opacity-40 hover:bg-white/5"
          style={{ color: 'var(--color-solar-text-secondary)' }}
        >
          ←
        </button>

        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`dots-${i}`} className="px-1 text-xs" style={{ color: 'var(--color-solar-text-muted)' }}>…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              className="w-7 h-7 text-xs rounded transition-all"
              style={{
                background: p === page ? 'var(--color-moon)' : 'transparent',
                color: p === page ? 'white' : 'var(--color-solar-text-secondary)',
                fontWeight: p === page ? '600' : undefined,
                boxShadow: p === page ? '0 0 8px rgba(99,102,241,0.3)' : undefined,
              }}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="px-2 py-1 text-xs rounded transition-colors disabled:opacity-40 hover:bg-white/5"
          style={{ color: 'var(--color-solar-text-secondary)' }}
        >
          →
        </button>
      </div>
    </div>
  );
}
