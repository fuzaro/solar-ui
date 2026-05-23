'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  PageHeader,
  DataTable,
  Badge,
  Button,
  Select,
  Input,
  Skeleton,
  AlertBanner,
  ConfirmDialog,
  useToast,
  type ColumnDef,
} from '@solar/ui';
import type { Task, PaginatedResponse, TaskStatus } from '@solar/api';
import { useSolar } from '../useSolar';
import { RefreshCw, Play, Filter } from 'lucide-react';

const STATUS_VARIANT: Record<TaskStatus, string> = {
  success: 'success',
  failed: 'error',
  running: 'warning',
  pending: 'default',
  timeout: 'warning',
  cancelled: 'default',
};

export function TaskHistory() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [rerunTarget, setRerunTarget] = useState<string[] | null>(null);
  const solar = useSolar();
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const pageSize = 20;

  const { data, isLoading, error } = useQuery<PaginatedResponse<Task>>({
    queryKey: ['tasks', 'history', page, statusFilter, sortBy],
    queryFn: () => solar.venus.tasks.list({
      page,
      page_size: pageSize,
      status: statusFilter as TaskStatus || undefined,
      sort: sortBy,
    }),
  });

  const rerunMutation = useMutation({
    mutationFn: async (taskIds: string[]) => {
      const tasks = await Promise.all(taskIds.map((id) => solar.venus.tasks.get(id)));
      return Promise.all(tasks.map((t) =>
        solar.venus.tasks.submit({
          idempotency_key: `rerun_${t.task_id}_${Date.now()}`,
          prompt: t.prompt,
          skills: t.skills,
          resources: t.resources,
          mode: t.mode,
          tags: { ...t.tags, rerun_of: t.task_id },
        })
      ));
    },
    onSuccess: (results) => {
      addToast({ type: 'success', title: 'Tasks re-submitted', description: `${results.length} task(s) queued successfully.` });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setSelectedIds(new Set());
      setRerunTarget(null);
    },
    onError: (err: Error) => {
      addToast({ type: 'error', title: 'Re-run failed', description: err.message });
    },
  });

  const tasks = data?.items ?? [];

  const columns: ColumnDef<Task>[] = [
    {
      key: 'task_id',
      header: 'Task ID',
      width: '140px',
      cell: (v) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--color-solar-text-secondary)' }}>
          {String(v).substring(0, 16)}…
        </span>
      ),
    },
    {
      key: 'prompt',
      header: 'Prompt',
      cell: (v) => (
        <span style={{ color: 'var(--color-solar-text-primary)', maxWidth: '300px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
          {String(v)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      cell: (v) => {
        const s = v as TaskStatus;
        return <Badge variant={STATUS_VARIANT[s] as any}>{s}</Badge>;
      },
    },
    {
      key: 'current_step',
      header: 'Duration',
      cell: (_v, row) => {
        const task = row as Task;
        if (!task.completed_at) return <span style={{ color: 'var(--color-solar-text-secondary)', fontSize: '0.75rem' }}>—</span>;
        const duration = new Date(task.completed_at).getTime() - new Date(task.created_at).getTime();
        const s = Math.floor(duration / 1000);
        return (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-solar-text-secondary)' }}>
            {s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`}
          </span>
        );
      },
    },
    {
      key: 'quality_metadata',
      header: 'Quality',
      cell: (v) => {
        const qm = v as Task['quality_metadata'];
        if (!qm) return <span style={{ color: 'var(--color-solar-text-secondary)', fontSize: '0.75rem' }}>—</span>;
        const score = Math.round(qm.confidence * 100);
        const color = score >= 80 ? 'var(--color-solar-success)' : score >= 50 ? 'var(--color-solar-warning)' : 'var(--color-solar-error)';
        return <span style={{ fontWeight: 600, fontSize: '0.8rem', color }}>{score}%</span>;
      },
    },
    {
      key: 'created_at',
      header: 'Created',
      sortable: true,
      cell: (v) => (
        <span style={{ color: 'var(--color-solar-text-secondary)', fontSize: '0.75rem' }}>
          {new Date(String(v)).toLocaleDateString()} {new Date(String(v)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      ),
    },
  ];

  const toggleSelect = (taskId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <PageHeader
        title="Task History"
        description="Browse and filter your complete task submission history."
      />

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={14} style={{ color: 'var(--color-solar-text-secondary)' }} />
          <Select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            style={{ width: '140px', fontSize: '0.8rem' }}
          >
            <option value="">All Statuses</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
            <option value="timeout">Timeout</option>
            <option value="cancelled">Cancelled</option>
            <option value="running">Running</option>
            <option value="pending">Pending</option>
          </Select>
        </div>
        <Select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{ width: '160px', fontSize: '0.8rem' }}
        >
          <option value="created_at">Newest First</option>
          <option value="-created_at">Oldest First</option>
          <option value="duration">Shortest Duration</option>
          <option value="-duration">Longest Duration</option>
        </Select>
        {selectedIds.size > 0 && (
          <Button
            size="sm"
            onClick={() => setRerunTarget(Array.from(selectedIds))}
          >
            <Play size={14} /> Re-run {selectedIds.size} task(s)
          </Button>
        )}
      </div>

      {error && (
        <AlertBanner type="warning" title="Failed to load history" description="Check your connection and try again." dismissible />
      )}

      {isLoading ? (
        <Skeleton lines={10} height="40px" />
      ) : (
        <DataTable<Task>
          columns={columns}
          data={tasks}
          emptyMessage="No tasks found matching your filters."
          onRowClick={(row) => { window.location.href = `/tasks/${row.task_id}`; }}
          pagination={data ? { page: data.page, pageSize: data.page_size, total: data.total } : undefined}
          onPageChange={setPage}
        />
      )}

      <ConfirmDialog
        open={!!rerunTarget}
        title="Re-run Tasks"
        description={`Re-submit ${rerunTarget?.length ?? 0} task(s) with their original parameters?`}
        confirmLabel="Re-run"
        onConfirm={() => rerunTarget && rerunMutation.mutate(rerunTarget)}
        onCancel={() => setRerunTarget(null)}
      />
    </div>
  );
}
