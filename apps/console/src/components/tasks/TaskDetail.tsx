'use client';

import { useQuery } from '@tanstack/react-query';
import {
  PageHeader,
  Badge,
  Card,
  Skeleton,
  AlertBanner,
  ExecutionStepper,
  QuotaBar,
  JsonViewer,
  Timeline,
  DataTable,
  type ColumnDef,
  type TimelineItem,
} from '@solar/ui';
import type { Task, ToolCall, QualityGateResult, ExecutionStep } from '@solar/api';
import { useSolar } from '../useSolar';
import { Providers } from '../Providers';
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Shield,
  FileText,
  Tag,
  ArrowLeft,
} from 'lucide-react';

const STEP_LABELS: Record<number, string> = {
  1: 'INTAKE',
  2: 'ADEQUATION',
  3: 'PREPARATION',
  4: 'EXECUTION',
  5: 'EVALUATION',
  6: 'DELIVERY',
  7: 'AUDIT',
};

const STATUS_COLORS: Record<string, string> = {
  success: 'var(--color-solar-success)',
  failed: 'var(--color-solar-error)',
  running: 'var(--color-solar-warning)',
  pending: 'var(--color-solar-text-secondary)',
  timeout: 'var(--color-solar-warning)',
  cancelled: 'var(--color-solar-accent)',
};

interface TaskDetailProps {
  taskId: string;
}

export function TaskDetail({ taskId }: TaskDetailProps) {
  return (
    <Providers>
      <TaskDetailContent taskId={taskId} />
    </Providers>
  );
}

function TaskDetailContent({ taskId }: TaskDetailProps) {
  const solar = useSolar();

  const { data: task, isLoading, error } = useQuery<Task>({
    queryKey: ['task', taskId],
    queryFn: () => solar.venus.tasks.get(taskId),
    refetchInterval: (query) => {
      const t = query.state.data;
      return t && (t.status === 'running' || t.status === 'pending') ? 3000 : false;
    },
  });

  const { data: steps } = useQuery({
    queryKey: ['task', taskId, 'steps'],
    queryFn: () => solar.moon.steps.list(taskId),
    enabled: !!task,
  });

  if (isLoading) {
    return (
      <div style={{ padding: '2rem' }}>
        <Skeleton lines={12} height="40px" />
      </div>
    );
  }

  if (error || !task) {
    return (
      <div style={{ padding: '2rem' }}>
        <AlertBanner type="error" title="Task not found" description={`Could not load task ${taskId}.`} />
      </div>
    );
  }

  const duration = task.completed_at
    ? Math.floor((new Date(task.completed_at).getTime() - new Date(task.created_at).getTime()) / 1000)
    : Math.floor((Date.now() - new Date(task.created_at).getTime()) / 1000);

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1100px' }}>
      {/* Back link */}
      <a href="/tasks/active" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-solar-text-secondary)', fontSize: '0.8rem', textDecoration: 'none' }}>
        <ArrowLeft size={14} /> Back to tasks
      </a>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-solar-text-primary)' }}>
              Task Detail
            </h1>
            <Badge variant={task.status === 'success' ? 'success' : task.status === 'failed' ? 'error' : task.status === 'running' ? 'warning' : 'default'}>
              {task.status}
            </Badge>
          </div>
          <p style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-solar-text-secondary)' }}>
            {task.task_id}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8rem', color: 'var(--color-solar-text-secondary)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Submitted</span>
            <span style={{ fontWeight: 500, color: 'var(--color-solar-text-primary)' }}>{new Date(task.created_at).toLocaleString()}</span>
          </div>
          {task.completed_at && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Completed</span>
              <span style={{ fontWeight: 500, color: 'var(--color-solar-text-primary)' }}>{new Date(task.completed_at).toLocaleString()}</span>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Duration</span>
            <span style={{ fontWeight: 500, color: 'var(--color-solar-text-primary)' }}>
              {duration < 60 ? `${duration}s` : `${Math.floor(duration / 60)}m ${duration % 60}s`}
            </span>
          </div>
        </div>
      </div>

      {/* Execution Stepper */}
      <SectionCard title="Execution Progress">
        <ExecutionStepper currentStep={task.current_step} totalSteps={7} size="lg" />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', padding: '0 0.5rem' }}>
          {Array.from({ length: 7 }, (_, i) => (
            <span key={i} style={{ fontSize: '0.6rem', color: i < task.current_step ? 'var(--color-solar-success)' : 'var(--color-solar-text-secondary)', fontFamily: 'var(--font-mono)' }}>
              {STEP_LABELS[i + 1]}
            </span>
          ))}
        </div>
      </SectionCard>

      {/* Prompt */}
      <SectionCard title="Prompt">
        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-solar-text-primary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
          {task.prompt}
        </p>
      </SectionCard>

      {/* Quality Report */}
      {task.quality_metadata && (
        <SectionCard title="Quality Report">
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '2rem', fontWeight: 700, color: task.quality_metadata.confidence >= 0.8 ? 'var(--color-solar-success)' : task.quality_metadata.confidence >= 0.5 ? 'var(--color-solar-warning)' : 'var(--color-solar-error)' }}>
                {Math.round(task.quality_metadata.confidence * 100)}%
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--color-solar-text-secondary)' }}>Confidence</span>
            </div>
            {task.quality_metadata.aura && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Badge variant={task.quality_metadata.aura.overall_band === 'green' ? 'success' : task.quality_metadata.aura.overall_band === 'red' ? 'error' : 'warning'}>
                  AURA: {task.quality_metadata.aura.overall_band.toUpperCase()}
                </Badge>
              </div>
            )}
            <Badge variant="default">{task.quality_metadata.flags}</Badge>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.5rem' }}>
            {task.quality_metadata.gates.map((gate: QualityGateResult) => (
              <div
                key={gate.gate}
                style={{
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-solar-border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                {gate.result === 'pass' ? <CheckCircle size={14} style={{ color: 'var(--color-solar-success)' }} /> :
                 gate.result === 'warn' ? <AlertTriangle size={14} style={{ color: 'var(--color-solar-warning)' }} /> :
                 <XCircle size={14} style={{ color: 'var(--color-solar-error)' }} />}
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-solar-text-primary)', textTransform: 'capitalize' }}>{gate.gate}</span>
                  <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--color-solar-text-secondary)' }}>{gate.result}</span>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Result */}
      {task.result && (
        <SectionCard title="Result">
          {task.result.agent_notes && (
            <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'rgba(99, 102, 241, 0.05)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-solar-text-primary)', fontStyle: 'italic' }}>
                {task.result.agent_notes}
              </p>
            </div>
          )}
          <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            <JsonViewer data={task.result.output} />
          </div>
          {task.result.tool_calls.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <p style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-solar-text-secondary)', textTransform: 'uppercase' }}>Tool Calls ({task.result.tool_calls.length})</p>
              <ToolCallsTable calls={task.result.tool_calls} />
            </div>
          )}
        </SectionCard>
      )}

      {/* Budget Consumed */}
      <SectionCard title="Budget Consumed">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <QuotaBar label="Tokens" used={3200} limit={10000} mode="soft" unit="tokens" />
          <QuotaBar label="Execution Time" used={duration} limit={3600} mode="hard" unit="seconds" />
          <QuotaBar label="Cost" used={0.12} limit={1.00} mode="soft" unit="USD" />
          <QuotaBar label="Tool Calls" used={task.result?.tool_calls.length ?? 0} limit={50} mode="hard" unit="calls" />
        </div>
      </SectionCard>

      {/* Step Ledger / Timeline */}
      {steps && steps.length > 0 && (
        <SectionCard title="Step Ledger">
          <Timeline
            items={steps.map((s: any, i: number) => ({
              id: String(i),
              title: s.step_name ?? STEP_LABELS[i + 1] ?? `Step ${i + 1}`,
              description: s.detail ?? s.status ?? 'completed',
              timestamp: s.started_at ?? s.timestamp ?? '',
              status: s.status === 'success' ? 'success' : s.status === 'failed' ? 'error' : 'default',
            } as TimelineItem))}
          />
        </SectionCard>
      )}

      {/* Metadata */}
      <SectionCard title="Metadata">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
          <MetaItem label="Mode" value={task.mode} />
          <MetaItem label="Depth" value={String(task.depth)} />
          <MetaItem label="Skills" value={task.skills.map((s) => s.skill_id).join(', ')} />
          {task.parent_task_id && <MetaItem label="Parent Task" value={task.parent_task_id.substring(0, 16) + '…'} />}
        </div>
        {Object.keys(task.tags).length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <p style={{ margin: '0 0 0.5rem', fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-solar-text-secondary)', textTransform: 'uppercase' }}>Tags</p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {Object.entries(task.tags).map(([k, v]) => (
                <Badge key={k} variant="default">
                  <Tag size={10} style={{ marginRight: 4 }} />{k}: {v}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--color-solar-card)', border: '1px solid var(--color-solar-border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
      <p style={{ margin: '0 0 1rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-solar-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {title}
      </p>
      {children}
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--color-solar-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>{label}</span>
      <span style={{ fontSize: '0.8rem', color: 'var(--color-solar-text-primary)', fontFamily: 'var(--font-mono)' }}>{value}</span>
    </div>
  );
}

function ToolCallsTable({ calls }: { calls: ToolCall[] }) {
  const columns: ColumnDef<ToolCall>[] = [
    { key: 'tool', header: 'Tool', cell: (v) => <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{String(v)}</span> },
    {
      key: 'status',
      header: 'Status',
      cell: (v) => <Badge variant={v === 'ok' ? 'success' : 'error'}>{String(v)}</Badge>,
    },
    {
      key: 'duration_ms',
      header: 'Duration',
      cell: (v) => <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-solar-text-secondary)' }}>{v ? `${v}ms` : '—'}</span>,
    },
  ];

  return <DataTable<ToolCall> columns={columns} data={calls} emptyMessage="No tool calls recorded." />;
}
