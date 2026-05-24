'use client';

import { useQuery } from '@tanstack/react-query';
import {
  PageHeader,
  StatsCard,
  DataTable,
  Badge,
  QuotaBar,
  AlertBanner,
  Skeleton,
  ExecutionStepper,
  type ColumnDef,
} from '@solar/ui';
import {
  createSolarClients,
  type Task,
  type PaginatedResponse,
  type TaskStatus,
} from '@solar/api';
import { useAuth } from '@solar/auth';
import { getSession } from '@solar/auth';
import { Providers } from './Providers';
import { CheckCircle, Clock, AlertTriangle, Layers, Zap, ArrowRight } from 'lucide-react';

const solar = createSolarClients({
  venus:   import.meta.env.PUBLIC_VENUS_URL   ?? 'http://localhost:8000',
  neptune: import.meta.env.PUBLIC_NEPTUNE_URL ?? 'http://localhost:8001',
  mars:    import.meta.env.PUBLIC_MARS_URL    ?? 'http://localhost:8002',
  moon:    import.meta.env.PUBLIC_MOON_URL    ?? 'http://localhost:8003',
  saturn:  import.meta.env.PUBLIC_SATURN_URL  ?? 'http://localhost:8006',
  sun:     import.meta.env.PUBLIC_SUN_URL     ?? 'http://localhost:8007',
  pluto:   import.meta.env.PUBLIC_PLUTO_URL   ?? 'http://localhost:8008',
  themis:  import.meta.env.PUBLIC_THEMIS_URL  ?? 'http://localhost:8009',
  getToken: () => getSession()?.token ?? null,
});

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function ConsoleDashboard() {
  return (
    <Providers>
      <ConsoleDashboardContent />
    </Providers>
  );
}

function ConsoleDashboardContent() {
  const { session } = useAuth();
  const displayName = session?.displayName || 'there';

  const {
    data: allTasks,
    isLoading: tasksLoading,
    error: tasksError,
  } = useQuery<PaginatedResponse<Task>>({
    queryKey: ['tasks', 'dashboard'],
    queryFn: () => solar.venus.tasks.list({ page: 1, page_size: 20 }),
    refetchInterval: 10_000,
  });

  const {
    data: activeTasks,
  } = useQuery<PaginatedResponse<Task>>({
    queryKey: ['tasks', 'dashboard-active'],
    queryFn: () => solar.venus.tasks.list({ status: 'running', page: 1, page_size: 5 }),
    refetchInterval: 5_000,
  });

  const tasks = allTasks?.items ?? [];
  const running = activeTasks?.items ?? [];

  const statsTotal = allTasks?.total ?? 0;
  const statsActive = running.length;
  const statsCompleted = tasks.filter((t) => t.status === 'success').length;
  const avgQuality = tasks
    .filter((t) => t.quality_metadata?.confidence)
    .reduce((sum, t, _, arr) => sum + (t.quality_metadata!.confidence / arr.length), 0);

  const recentCompleted = tasks
    .filter((t) => t.status === 'success' || t.status === 'failed')
    .slice(0, 5);

  const RECENT_COLUMNS: ColumnDef<Task>[] = [
    {
      key: 'prompt',
      header: 'Task',
      cell: (v) => (
        <span style={{ color: 'var(--color-solar-text-primary)', fontSize: '0.85rem', maxWidth: '320px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {String(v)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (v) => {
        const s = v as TaskStatus;
        const variant = s === 'success' ? 'success' : s === 'failed' ? 'error' : s === 'running' ? 'warning' : 'default';
        return <Badge variant={variant}>{s}</Badge>;
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
        return <span style={{ fontWeight: 600, color, fontSize: '0.8rem' }}>{score}%</span>;
      },
    },
    {
      key: 'created_at',
      header: 'When',
      cell: (v) => {
        const ago = Date.now() - new Date(String(v)).getTime();
        const mins = Math.floor(ago / 60000);
        const display = mins < 60 ? `${mins}m ago` : mins < 1440 ? `${Math.floor(mins / 60)}h ago` : `${Math.floor(mins / 1440)}d ago`;
        return <span style={{ fontSize: '0.75rem', color: 'var(--color-solar-text-secondary)' }}>{display}</span>;
      },
    },
  ];

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Welcome */}
      <div style={{ marginBottom: '0.5rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-solar-text-primary)' }}>
          {getGreeting()}, {displayName}.
        </h1>
        <p style={{ margin: '0.375rem 0 0', fontSize: '0.9rem', color: 'var(--color-solar-text-secondary)' }}>
          {statsActive > 0
            ? `You have ${statsActive} active task${statsActive > 1 ? 's' : ''} running.`
            : 'All quiet — ready to submit a new task.'}
        </p>
      </div>

      {tasksError && (
        <AlertBanner
          type="warning"
          title="Could not load task data"
          description="The Venus API is unreachable. Check your environment configuration."
          dismissible
        />
      )}

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
        <StatsCard
          label="Active Tasks"
          value={tasksLoading ? '—' : statsActive}
          icon={<Clock size={20} />}
          planet="mars"
        />
        <StatsCard
          label="Completed Today"
          value={tasksLoading ? '—' : statsCompleted}
          icon={<CheckCircle size={20} />}
          planet="jupiter"
          trend={statsCompleted > 0 ? { direction: 'up', percent: statsCompleted * 10 } : undefined}
        />
        <StatsCard
          label="Credits Remaining"
          value="$47.50"
          icon={<Layers size={20} />}
          planet="saturn"
        />
        <StatsCard
          label="Avg Quality"
          value={tasksLoading ? '—' : avgQuality > 0 ? `${Math.round(avgQuality * 100)}%` : '—'}
          icon={<Zap size={20} />}
          planet="venus"
          trend={avgQuality >= 0.8 ? { direction: 'up', percent: Math.round(avgQuality * 100) } : undefined}
        />
      </div>

      {/* Active tasks mini-list */}
      {running.length > 0 && (
        <div style={{ background: 'var(--color-solar-card)', border: '1px solid var(--color-solar-border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-solar-text-primary)' }}>
              Active Tasks
            </p>
            <a href="/tasks/active" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--color-solar-accent)', textDecoration: 'none' }}>
              View all <ArrowRight size={12} />
            </a>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {running.slice(0, 3).map((task) => (
              <a key={task.task_id} href={`/tasks/${task.task_id}`} style={{ textDecoration: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-solar-border)', transition: 'border-color 0.15s' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-solar-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {task.prompt}
                    </p>
                  </div>
                  <ExecutionStepper currentStep={task.current_step} totalSteps={7} size="sm" />
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-solar-text-secondary)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                    Step {task.current_step}/7
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Budget Overview */}
      <div style={{ background: 'var(--color-solar-card)', border: '1px solid var(--color-solar-border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
        <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-solar-text-primary)', margin: 0 }}>
          Resource Quotas
        </p>
        <QuotaBar label="Token Budget" used={12500} limit={50000} mode="soft" unit="tokens" />
        <QuotaBar label="Execution Time" used={480} limit={3600} mode="hard" unit="seconds" />
        <QuotaBar label="Cost Budget" used={2.50} limit={50.00} mode="soft" unit="USD" />
        <QuotaBar label="Tool Calls" used={37} limit={200} mode="hard" unit="calls" />
      </div>

      {/* Recent results */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-solar-text-primary)', margin: 0 }}>
            Recent Results
          </p>
          <a href="/tasks/history" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--color-solar-accent)', textDecoration: 'none' }}>
            View all <ArrowRight size={12} />
          </a>
        </div>
        {tasksLoading ? (
          <Skeleton lines={5} height="40px" />
        ) : (
          <DataTable<Task>
            columns={RECENT_COLUMNS}
            data={recentCompleted}
            emptyMessage="No completed tasks yet. Submit your first task to get started."
            onRowClick={(row) => { window.location.href = `/tasks/${row.task_id}`; }}
          />
        )}
      </div>
    </div>
  );
}
