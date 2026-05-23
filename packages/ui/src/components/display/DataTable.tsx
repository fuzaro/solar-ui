'use client';

import React, { useState } from 'react';
import clsx from 'clsx';

export interface ColumnDef<T = Record<string, unknown>> {
  key: string;
  header: string;
  cell?: (value: unknown, row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total?: number;
  onPageChange?: (page: number) => void;
}

export interface SortingState {
  key: string;
  direction: 'asc' | 'desc';
}

export interface RowAction {
  label: string;
  onClick: () => void;
  destructive?: boolean;
}

export interface DataTableProps<T = Record<string, unknown>> {
  columns: ColumnDef<T>[];
  data: T[];
  loading?: boolean;
  pagination?: PaginationState;
  onPaginationChange?: (p: PaginationState) => void;
  onPageChange?: (page: number) => void;
  sorting?: SortingState;
  onSortingChange?: (s: SortingState) => void;
  emptyMessage?: string;
  rowActions?: (row: T) => RowAction[];
  onRowClick?: (row: T) => void;
  total?: number;
}

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div
            className="h-4 rounded"
            style={{
              width: `${60 + Math.random() * 30}%`,
              background: 'var(--color-solar-elevated)',
              animation: 'solar-shimmer 1.5s infinite',
              backgroundSize: '200% 100%',
            }}
          />
        </td>
      ))}
    </tr>
  );
}

function RowActionsMenu({ actions }: { actions: RowAction[] }) {
  const [open, setOpen] = useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative flex items-center justify-end">
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-1.5 rounded-md transition-colors hover:bg-white/5"
        style={{ color: 'var(--color-solar-text-muted)' }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
          <circle cx="7" cy="2" r="1.2"/><circle cx="7" cy="7" r="1.2"/><circle cx="7" cy="12" r="1.2"/>
        </svg>
      </button>
      {open && (
        <div
          className="absolute right-0 top-full mt-1 w-40 rounded-lg py-1 z-50"
          style={{
            background: 'var(--color-solar-elevated)',
            border: '1px solid var(--color-solar-border)',
            boxShadow: 'var(--shadow-elevated)',
          }}
        >
          {actions.map((action, i) => (
            <button
              key={i}
              onClick={() => { action.onClick(); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-xs transition-colors hover:bg-white/5"
              style={{ color: action.destructive ? 'var(--color-venus)' : 'var(--color-solar-text-secondary)' }}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function DataTable<T = Record<string, unknown>>({
  columns,
  data,
  loading,
  pagination,
  onPaginationChange,
  sorting,
  onSortingChange,
  emptyMessage = 'No data available',
  rowActions,
  onRowClick,
  total,
}: DataTableProps<T>) {
  const pageSizeOptions = [10, 25, 50, 100];
  const hasActions = !!rowActions;

  function handleSort(key: string) {
    if (!onSortingChange) return;
    if (sorting?.key === key) {
      onSortingChange({ key, direction: sorting.direction === 'asc' ? 'desc' : 'asc' });
    } else {
      onSortingChange({ key, direction: 'asc' });
    }
  }

  const totalPages = pagination && total ? Math.ceil(total / pagination.pageSize) : 1;

  return (
    <div className="flex flex-col gap-0" style={{ border: '1px solid var(--color-solar-border)', borderRadius: '0.75rem', overflow: 'hidden' }}>
      <div className="overflow-x-auto">
        <table className="w-full text-xs" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--color-solar-surface)', borderBottom: '1px solid var(--color-solar-border)' }}>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={clsx(
                    'px-4 py-3 text-left font-medium uppercase tracking-wider',
                    col.sortable && 'cursor-pointer select-none hover:text-white transition-colors'
                  )}
                  style={{
                    color: 'var(--color-solar-text-muted)',
                    width: col.width,
                    whiteSpace: 'nowrap',
                  }}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <span className="flex items-center gap-1">
                    {col.header}
                    {col.sortable && (
                      <span style={{ opacity: sorting?.key === col.key ? 1 : 0.3 }}>
                        {sorting?.key === col.key && sorting.direction === 'desc' ? '↓' : '↑'}
                      </span>
                    )}
                  </span>
                </th>
              ))}
              {hasActions && <th className="px-4 py-3 w-10" />}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <SkeletonRow key={i} cols={columns.length + (hasActions ? 1 : 0)} />
              ))
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (hasActions ? 1 : 0)}
                  className="px-4 py-12 text-center"
                  style={{ color: 'var(--color-solar-text-muted)' }}
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, rowIdx) => (
                <tr
                  key={rowIdx}
                  style={{ borderBottom: '1px solid var(--color-solar-divider)', cursor: onRowClick ? 'pointer' : undefined }}
                  className="transition-colors hover:bg-white/[0.02]"
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col) => {
                    const value = (row as Record<string, unknown>)[col.key];
                    return (
                      <td
                        key={col.key}
                        className="px-4 py-3"
                        style={{ color: 'var(--color-solar-text-secondary)' }}
                      >
                        {col.cell ? col.cell(value, row) : (
                          <span className="font-mono">{String(value ?? '—')}</span>
                        )}
                      </td>
                    );
                  })}
                  {hasActions && rowActions && (
                    <td className="px-2 py-2">
                      <RowActionsMenu actions={rowActions(row)} />
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && onPaginationChange && (
        <div
          className="flex items-center justify-between px-4 py-3 gap-4"
          style={{ borderTop: '1px solid var(--color-solar-border)', background: 'var(--color-solar-surface)' }}
        >
          <div className="flex items-center gap-2">
            <span style={{ color: 'var(--color-solar-text-muted)' }} className="text-xs">Rows:</span>
            <select
              value={pagination.pageSize}
              onChange={(e) => onPaginationChange({ page: 1, pageSize: Number(e.target.value) })}
              className="text-xs rounded px-1.5 py-1 border"
              style={{
                background: 'var(--color-solar-card)',
                color: 'var(--color-solar-text-secondary)',
                borderColor: 'var(--color-solar-border)',
              }}
            >
              {pageSizeOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs" style={{ color: 'var(--color-solar-text-muted)' }}>
              Page {pagination.page} of {totalPages}
              {total !== undefined && ` · ${total} total`}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPaginationChange({ ...pagination, page: Math.max(1, pagination.page - 1) })}
              disabled={pagination.page <= 1}
              className="px-2 py-1 rounded text-xs transition-colors disabled:opacity-40 hover:bg-white/5"
              style={{ color: 'var(--color-solar-text-secondary)' }}
            >
              ← Prev
            </button>
            <button
              onClick={() => onPaginationChange({ ...pagination, page: Math.min(totalPages, pagination.page + 1) })}
              disabled={pagination.page >= totalPages}
              className="px-2 py-1 rounded text-xs transition-colors disabled:opacity-40 hover:bg-white/5"
              style={{ color: 'var(--color-solar-text-secondary)' }}
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
