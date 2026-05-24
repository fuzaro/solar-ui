'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  PageHeader,
  Badge,
  Button,
  Card,
  Skeleton,
  AlertBanner,
  EmptyState,
  ExecutionStepper,
  ConfirmDialog,
  useToast,
} from '@solar/ui';
import type { Task, PaginatedResponse } from '@solar/api';
import { SolarApiError } from '@solar/api';
import { useSolar } from '../useSolar';
import { Providers } from '../Providers';
import { Clock, LayoutGrid, List, X, Play, RefreshCw } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  running: 'var(--color-solar-warning)',
  pending: 'var(--color-solar-text-secondary)',
  success: 'var(--color-solar-success)',
  failed: 'var(--color-solar-error)',
};

function formatElapsed(createdAt: string): string {
  const ms = Date.now() - new Date(createdAt).getTime();
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

export function ActiveTasks() {
  return (
    <Providers>
      <ActiveTasksContent />
    </Providers>
  );
}

function ActiveTasksContent() {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const solar = useSolar();
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const { data, isLoading, error } = useQuery<PaginatedResponse<Task>>({
    queryKey: ['tasks', 'active'],
    queryFn: () => solar.venus.tasks.list({ status: 'running', page: 1, page_size: 50 }),
    refetchInterval: 3000,
  });

  const { data: pendingData } = useQuery<PaginatedResponse<Task>>({
    queryKey: ['tasks', 'pending'],
    queryFn: () => solar.venus.tasks.list({ status: 'pending', page: 1, page_size: 50 }),
    refetchInterval: 3000,
  });

  const cancelMutation = useMutation({
    mutationFn: (taskId: string) => solar.venus.tasks.cancel(taskId),
    onSuccess: () => {
      addToast({ type: 'success', title: 'Task cancelled', description: 'The task has been cancelled successfully.' });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setCancelTarget(null);
    },
    onError: (err: Error) => {
      addToast({ type: 'error', title: 'Cancel failed', description: err.message });
    },
  });

  const activeTasks = data?.items ?? [];
  const pendingTasks = pendingData?.items ?? [];
  const allTasks = [...activeTasks, ...pendingTasks];

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <PageHeader
          title="Active Tasks"
          description={`${activeTasks.length} running, ${pendingTasks.length} pending`}
        />
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button
            variant={viewMode === 'grid' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid size={14} />
          </Button>
          <Button
            variant={viewMode === 'table' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('table')}
          >
            <List size={14} />
          </Button>
        </div>
      </div>

      {error && (
        <AlertBanner
          type={error instanceof SolarApiError && error.error.status === 402 ? 'error' : 'warning'}
          title={
            error instanceof SolarApiError && error.error.status === 402
              ? 'Insufficient Balance'
              : 'Could not load active tasks'
          }
          description={
            error instanceof SolarApiError && error.error.status === 402
              ? 'Your tenant has insufficient balance to fetch tasks. Please recharge your account.'
              : error instanceof SolarApiError && error.error.status === 429
                ? 'Rate limited — too many requests. Auto-retry in 3 seconds.'
                : 'The Venus API is unreachable. Auto-retry in 3 seconds.'
          }
          actions={
            <>
              {error instanceof SolarApiError && error.error.status === 402 && (
                <Badge variant="warning">Insufficient Balance</Badge>
              )}
              {error instanceof SolarApiError && error.error.status === 429 && (
                <Badge variant="default">Rate Limited</Badge>
              )}
            </>
          }
          dismissible
        />
      )}

      {isLoading ? (
        <Skeleton lines={6} height="120px" />
      ) : allTasks.length === 0 ? (
        <EmptyState
          icon={<Play size={48} />}
          title="No active tasks"
          description="Submit a new task to see it appear here in real-time."
        />
      ) : viewMode === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1rem' }}>
          {allTasks.map((task) => (
            <TaskCard key={task.task_id} task={task} onCancel={() => setCancelTarget(task.task_id)} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {allTasks.map((task) => (
            <TaskRow key={task.task_id} task={task} onCancel={() => setCancelTarget(task.task_id)} />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!cancelTarget}
        title="Cancel Task"
        description="Are you sure you want to cancel this task? This action cannot be undone."
        confirmLabel="Cancel Task"
        variant="danger"
        onConfirm={() => cancelTarget && cancelMutation.mutate(cancelTarget)}
        onCancel={() => setCancelTarget(null)}
      />
    </div>
  );
}

function TaskCard({ task, onCancel }: { task: Task; onCancel: () => void }) {
  return (
    <a
      href={`/tasks/${task.task_id}`}
      style={{ textDecoration: 'none', display: 'block' }}
    >
      <div
        style={{
          background: 'var(--color-solar-card)',
          border: '1px solid var(--color-solar-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.875rem',
          transition: 'border-color 0.15s ease',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--color-solar-accent)')}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--color-solar-border)')}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Badge variant={task.status === 'running' ? 'warning' : 'default'}>
            {task.status === 'running' && <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--color-solar-warning)', marginRight: 4, animation: 'pulse 1.5s infinite' }} />}
            {task.status}
          </Badge>
          <span style={{ fontSize: '0.7rem', color: 'var(--color-solar-text-secondary)', fontFamily: 'var(--font-mono)' }}>
            {task.task_id.substring(0, 12)}…
          </span>
        </div>

        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-solar-text-primary)', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {task.prompt}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ExecutionStepper currentStep={task.current_step} totalSteps={7} size="sm" />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--color-solar-text-secondary)', fontSize: '0.75rem' }}>
            <Clock size={12} />
            {formatElapsed(task.created_at)}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onCancel(); }}
            style={{ color: 'var(--color-solar-error)' }}
          >
            <X size={14} /> Cancel
          </Button>
        </div>
      </div>
    </a>
  );
}

function TaskRow({ task, onCancel }: { task: Task; onCancel: () => void }) {
  return (
    <a href={`/tasks/${task.task_id}`} style={{ textDecoration: 'none' }}>
      <div
        style={{
          background: 'var(--color-solar-card)',
          border: '1px solid var(--color-solar-border)',
          borderRadius: 'var(--radius-md)',
          padding: '0.875rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          transition: 'border-color 0.15s ease',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--color-solar-accent)')}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--color-solar-border)')}
      >
        <Badge variant={task.status === 'running' ? 'warning' : 'default'}>{task.status}</Badge>
        <span style={{ flex: 1, fontSize: '0.85rem', color: 'var(--color-solar-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {task.prompt}
        </span>
        <span style={{ fontSize: '0.75rem', color: 'var(--color-solar-text-secondary)', fontFamily: 'var(--font-mono)' }}>
          Step {task.current_step}/7
        </span>
        <span style={{ fontSize: '0.75rem', color: 'var(--color-solar-text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <Clock size={12} /> {formatElapsed(task.created_at)}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onCancel(); }}
          style={{ color: 'var(--color-solar-error)' }}
        >
          <X size={14} />
        </Button>
      </div>
    </a>
  );
}
