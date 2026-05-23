'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  PageHeader,
  DataTable,
  Badge,
  Button,
  Modal,
  Input,
  Textarea,
  FormField,
  Switch,
  Card,
  Skeleton,
  useToast,
  type ColumnDef,
} from '@solar/ui';
import { solar } from '../solarApi';
import { Clock, Plus, Play, Pause, Calendar, Zap } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScheduledTask {
  id: string;
  cron: string;
  skill_id: string;
  display_name: string;
  prompt: string;
  enabled: boolean;
  last_run_status: 'success' | 'failed' | 'pending' | 'running' | null;
  last_run_at: string | null;
  next_run_at: string;
  created_at: string;
}

interface EventSubscription {
  id: string;
  subject_pattern: string;
  action_skill: string;
  enabled: boolean;
  trigger_count: number;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const scheduleSchema = z.object({
  display_name: z.string().min(2).max(128),
  cron: z.string().min(9).regex(/^[\d*,\-/\s]+$/, 'Invalid cron expression'),
  skill_id: z.string().min(1),
  prompt: z.string().min(5).max(2048),
  enabled: z.boolean(),
});

type ScheduleForm = z.infer<typeof scheduleSchema>;

// ─── Cron preview helper ──────────────────────────────────────────────────────

function cronToHuman(cron: string): string {
  const parts = cron.trim().split(/\s+/);
  if (parts.length < 5) return cron;
  const [min, hour, dom, mon, dow] = parts;

  if (min === '0' && hour === '*') return 'Every hour at :00';
  if (min === '*/5') return 'Every 5 minutes';
  if (min === '*/15') return 'Every 15 minutes';
  if (min === '*/30') return 'Every 30 minutes';
  if (min === '0' && hour !== '*' && dom === '*' && dow === '*') return `Daily at ${hour.padStart(2, '0')}:00`;
  if (dow === '1-5' && hour !== '*') return `Weekdays at ${hour.padStart(2, '0')}:${min.padStart(2, '0')}`;
  if (dom === '1' && mon === '*') return `Monthly on the 1st at ${hour}:${min}`;
  return cron;
}

// ─── Columns ──────────────────────────────────────────────────────────────────

const SCHEDULE_COLUMNS: ColumnDef<ScheduledTask>[] = [
  {
    key: 'display_name',
    header: 'Task',
    cell: (v) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Clock size={14} style={{ color: 'var(--color-planet-sun)' }} />
        <span style={{ fontWeight: 500, color: 'var(--color-solar-text-primary)' }}>{String(v)}</span>
      </div>
    ),
  },
  {
    key: 'cron',
    header: 'Schedule',
    cell: (v) => (
      <div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-solar-text-primary)' }}>{String(v)}</span>
        <p style={{ margin: 0, fontSize: '0.6875rem', color: 'var(--color-solar-text-secondary)' }}>{cronToHuman(String(v))}</p>
      </div>
    ),
  },
  {
    key: 'skill_id',
    header: 'Skill',
    cell: (v) => <Badge variant="info">{String(v)}</Badge>,
  },
  {
    key: 'next_run_at',
    header: 'Next Run',
    cell: (v) => <span style={{ fontSize: '0.75rem', color: 'var(--color-solar-text-secondary)' }}>{new Date(String(v)).toLocaleString()}</span>,
  },
  {
    key: 'last_run_status',
    header: 'Last Status',
    cell: (v) => {
      if (!v) return <span style={{ fontSize: '0.75rem', color: 'var(--color-solar-text-secondary)' }}>Never run</span>;
      const s = String(v);
      const variant = s === 'success' ? 'success' : s === 'running' ? 'info' : s === 'failed' ? 'error' : 'default';
      return <Badge variant={variant}>{s}</Badge>;
    },
  },
  {
    key: 'enabled',
    header: 'Enabled',
    cell: (v) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: v ? 'var(--color-aura-green)' : 'var(--color-solar-border)' }} />
        <span style={{ fontSize: '0.75rem', color: 'var(--color-solar-text-secondary)' }}>{v ? 'Active' : 'Disabled'}</span>
      </div>
    ),
  },
];

const EVENT_COLUMNS: ColumnDef<EventSubscription>[] = [
  {
    key: 'subject_pattern',
    header: 'Subject Pattern',
    cell: (v) => <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: 'var(--color-solar-text-primary)' }}>{String(v)}</span>,
  },
  {
    key: 'action_skill',
    header: 'Trigger Skill',
    cell: (v) => <Badge variant="info">{String(v)}</Badge>,
  },
  {
    key: 'enabled',
    header: 'Status',
    cell: (v) => <Badge variant={v ? 'success' : 'default'}>{v ? 'Active' : 'Disabled'}</Badge>,
  },
  {
    key: 'trigger_count',
    header: 'Triggers',
    cell: (v) => <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>{Number(v).toLocaleString()}</span>,
  },
];

// ─── Demo data ────────────────────────────────────────────────────────────────

const DEMO_SCHEDULES: ScheduledTask[] = [
  { id: 'sched_1', display_name: 'Daily Model Quality Check', cron: '0 6 * * *', skill_id: 'quality.check', prompt: 'Run quality assessment on all active models', enabled: true, last_run_status: 'success', last_run_at: new Date(Date.now() - 86400000).toISOString(), next_run_at: new Date(Date.now() + 43200000).toISOString(), created_at: new Date(Date.now() - 604800000).toISOString() },
  { id: 'sched_2', display_name: 'Hourly Health Sweep', cron: '0 * * * *', skill_id: 'health.sweep', prompt: 'Check all service endpoints and report degradations', enabled: true, last_run_status: 'success', last_run_at: new Date(Date.now() - 3600000).toISOString(), next_run_at: new Date(Date.now() + 1800000).toISOString(), created_at: new Date(Date.now() - 1209600000).toISOString() },
  { id: 'sched_3', display_name: 'Weekly Audit Report', cron: '0 9 * * 1', skill_id: 'audit.report', prompt: 'Generate weekly audit summary report', enabled: false, last_run_status: 'failed', last_run_at: new Date(Date.now() - 172800000).toISOString(), next_run_at: new Date(Date.now() + 345600000).toISOString(), created_at: new Date(Date.now() - 2592000000).toISOString() },
];

const DEMO_EVENTS: EventSubscription[] = [
  { id: 'evt_1', subject_pattern: 'agent.*.degraded', action_skill: 'alert.notify', enabled: true, trigger_count: 12 },
  { id: 'evt_2', subject_pattern: 'model.quality.below_threshold', action_skill: 'quality.investigate', enabled: true, trigger_count: 3 },
  { id: 'evt_3', subject_pattern: 'tenant.budget.exhausted', action_skill: 'budget.alert', enabled: false, trigger_count: 0 },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export function SchedulingPage() {
  const [showCreate, setShowCreate] = useState(false);
  const { toast } = useToast();

  const { register, handleSubmit, watch, formState: { errors }, reset } = useForm<ScheduleForm>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: { enabled: true, cron: '0 * * * *' },
  });

  const cronValue = watch('cron');

  const submit = handleSubmit((data) => {
    toast({ title: 'Schedule created', description: `"${data.display_name}" — ${cronToHuman(data.cron)}`, type: 'success' });
    setShowCreate(false);
    reset();
  });

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <PageHeader
        title="Scheduling"
        description="Manage scheduled tasks, cron expressions, and event-driven subscriptions."
        actions={
          <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>
            <Plus size={14} /> Create Schedule
          </Button>
        }
      />

      {/* Scheduled Tasks */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <Calendar size={16} style={{ color: 'var(--color-planet-sun)' }} />
          <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-solar-text-primary)' }}>Scheduled Tasks</p>
        </div>
        <DataTable<ScheduledTask>
          columns={SCHEDULE_COLUMNS}
          data={DEMO_SCHEDULES}
          emptyMessage="No scheduled tasks configured."
        />
      </div>

      {/* Event Subscriptions */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <Zap size={16} style={{ color: 'var(--color-planet-mercury, var(--color-planet-neptune))' }} />
          <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-solar-text-primary)' }}>Event Subscriptions (Mercury)</p>
        </div>
        <DataTable<EventSubscription>
          columns={EVENT_COLUMNS}
          data={DEMO_EVENTS}
          emptyMessage="No event subscriptions configured."
        />
      </div>

      {/* Create Schedule Modal */}
      {showCreate && (
        <Modal title="Create Scheduled Task" open={showCreate} onClose={() => setShowCreate(false)} size="md">
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <FormField label="Task Name" error={errors.display_name?.message}>
              <Input {...register('display_name')} placeholder="Daily Quality Check" />
            </FormField>

            <FormField label="Cron Expression" error={errors.cron?.message}>
              <Input {...register('cron')} placeholder="0 * * * *" style={{ fontFamily: 'var(--font-mono)' }} />
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'var(--color-planet-sun)' }}>
                Preview: {cronToHuman(cronValue || '')}
              </p>
            </FormField>

            <FormField label="Skill ID" error={errors.skill_id?.message}>
              <Input {...register('skill_id')} placeholder="quality.check" />
            </FormField>

            <FormField label="Prompt / Task Template" error={errors.prompt?.message}>
              <Textarea {...register('prompt')} placeholder="Instructions for the scheduled execution..." rows={3} />
            </FormField>

            <FormField label="Enabled">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="checkbox" {...register('enabled')} />
                <span style={{ fontSize: '0.8125rem' }}>Enable this schedule immediately</span>
              </label>
            </FormField>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button type="submit" variant="primary">Create Schedule</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
