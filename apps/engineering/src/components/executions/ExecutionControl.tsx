'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  PageHeader,
  DataTable,
  Badge,
  Button,
  ExecutionStepper,
  Drawer,
  ConfirmDialog,
  Tabs,
  type ColumnDef,
} from '@solar/ui';
import { createSolarClients, getSolarConfig } from '@solar/api';
import { getSession } from '@solar/auth';
import { Providers } from '../Providers';
import { RefreshCw } from 'lucide-react';
import { StepLedger } from './StepLedger';
import { ReplayControl } from './ReplayControl';

// ─── Solar clients ────────────────────────────────────────────────────────────

const solar = createSolarClients({
  ...getSolarConfig(),
  getToken: () => getSession()?.token ?? null,
});

// ─── Types ────────────────────────────────────────────────────────────────────

interface ExecutionRow {
  exec_id: string;
  task_id: string;
  status: string;
  current_step: number;
  agent_id: string;
  model_id: string;
  duration_ms: number;
  budget_consumed: number;
  started_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  running: 'info',
  success: 'success',
  failed: 'error',
  cancelled: 'warning',
  timeout: 'error',
  pending: 'neutral',
};

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}

// ─── Columns ──────────────────────────────────────────────────────────────────

const EXECUTION_COLUMNS: ColumnDef<ExecutionRow>[] = [
  {
    key: 'exec_id',
    header: 'Exec ID',
    cell: (v) => (
      <code style={{ fontSize: '0.6875rem', fontFamily: 'var(--font-mono)', color: 'var(--color-solar-text-primary)' }}>
        {String(v).slice(0, 12)}…
      </code>
    ),
  },
  {
    key: 'task_id',
    header: 'Task',
    cell: (v) => (
      <code style={{ fontSize: '0.6875rem', fontFamily: 'var(--font-mono)', color: 'var(--color-solar-text-secondary)' }}>
        {String(v).slice(0, 12)}…
      </code>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    sortable: true,
    cell: (v) => (
      <Badge variant={(STATUS_COLORS[String(v)] || 'neutral') as any}>
        {String(v)}
      </Badge>
    ),
  },
  {
    key: 'current_step',
    header: 'Step',
    cell: (v) => (
      <div style={{ minWidth: '120px' }}>
        <ExecutionStepper currentStep={Number(v)} />
      </div>
    ),
  },
  {
    key: 'agent_id',
    header: 'Agent',
    cell: (v) => (
      <code style={{ fontSize: '0.6875rem', fontFamily: 'var(--font-mono)', color: 'var(--color-solar-text-secondary)' }}>
        {String(v)}
      </code>
    ),
  },
  {
    key: 'model_id',
    header: 'Model',
    cell: (v) => (
      <code style={{ fontSize: '0.6875rem', fontFamily: 'var(--font-mono)', color: 'var(--color-solar-text-secondary)' }}>
        {String(v)}
      </code>
    ),
  },
  {
    key: 'duration_ms',
    header: 'Duration',
    sortable: true,
    cell: (v) => (
      <span style={{ fontSize: '0.8125rem', fontFamily: 'var(--font-mono)', color: 'var(--color-solar-text-primary)' }}>
        {formatDuration(Number(v))}
      </span>
    ),
  },
  {
    key: 'budget_consumed',
    header: 'Budget',
    cell: (v) => (
      <span style={{ fontSize: '0.8125rem', fontFamily: 'var(--font-mono)', color: 'var(--color-solar-text-secondary)' }}>
        {Number(v).toLocaleString()} tok
      </span>
    ),
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function ExecutionControl() {
  return (
    <Providers>
      <ExecutionControlContent />
    </Providers>
  );
}

function ExecutionControlContent() {
  const [activeTab, setActiveTab] = useState('running');
  const [selectedExec, setSelectedExec] = useState<ExecutionRow | null>(null);
  const [drawerMode, setDrawerMode] = useState<'ledger' | 'replay' | null>(null);
  const [cancelExecId, setCancelExecId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: executions, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['executions', activeTab],
    queryFn: async () => {
      const status = activeTab === 'running' ? 'running' : undefined;
      const resp = await solar.mars.executions.list({ status, page_size: 50 });
      return (resp.items || []).map((e: any) => ({
        exec_id: e.exec_id || e.id || '',
        task_id: e.task_id || '',
        status: e.status || 'pending',
        current_step: e.current_step || 1,
        agent_id: e.agent_id || '—',
        model_id: e.model_id || '—',
        duration_ms: e.duration_ms || 0,
        budget_consumed: e.budget_consumed || 0,
        started_at: e.started_at || e.created_at || '',
      })) as ExecutionRow[];
    },
    refetchInterval: activeTab === 'running' ? 5_000 : 30_000,
  });

  const cancelMutation = useMutation({
    mutationFn: (execId: string) => solar.mars.executions.cancel(execId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['executions'] });
      setCancelExecId(null);
    },
  });

  const openLedger = (exec: ExecutionRow) => {
    setSelectedExec(exec);
    setDrawerMode('ledger');
  };

  const openReplay = (exec: ExecutionRow) => {
    setSelectedExec(exec);
    setDrawerMode('replay');
  };

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <PageHeader
          title="Execution Control"
          description="Monitor and manage running executions across the Mars execution engine."
          badge={executions ? `${executions.length} executions` : undefined}
        />
        <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isRefetching}>
          <RefreshCw size={14} className={isRefetching ? 'animate-spin' : ''} /> Refresh
        </Button>
      </div>

      <Tabs
        value={activeTab}
        onChange={setActiveTab}
        items={[
          { value: 'running', label: 'Running' },
          { value: 'recent', label: 'Recent' },
          { value: 'failed', label: 'Failed' },
        ]}
      />

      <DataTable<ExecutionRow>
        columns={EXECUTION_COLUMNS}
        data={executions || []}
        emptyMessage={isLoading ? 'Loading executions…' : 'No executions found.'}
        rowActions={(row) => [
          { label: 'View Ledger', onClick: () => openLedger(row) },
          { label: 'Replay', onClick: () => openReplay(row) },
          { label: 'Cancel', onClick: () => setCancelExecId(row.exec_id), destructive: true },
        ]}
      />

      {/* Step Ledger Drawer */}
      <Drawer
        open={drawerMode === 'ledger' && !!selectedExec}
        onClose={() => setDrawerMode(null)}
        title={`Step Ledger — ${selectedExec?.exec_id.slice(0, 12)}…`}
        side="right"
        size="lg"
      >
        {selectedExec && <StepLedger execId={selectedExec.exec_id} taskId={selectedExec.task_id} />}
      </Drawer>

      {/* Replay Drawer */}
      <Drawer
        open={drawerMode === 'replay' && !!selectedExec}
        onClose={() => setDrawerMode(null)}
        title={`Replay Execution`}
        side="right"
        size="lg"
      >
        {selectedExec && (
          <ReplayControl
            originalExec={selectedExec}
            onClose={() => setDrawerMode(null)}
          />
        )}
      </Drawer>

      {/* Cancel Confirmation */}
      <ConfirmDialog
        open={!!cancelExecId}
        onCancel={() => setCancelExecId(null)}
        onConfirm={() => cancelExecId && cancelMutation.mutate(cancelExecId)}
        title="Cancel Execution"
        description={`Are you sure you want to cancel execution ${cancelExecId?.slice(0, 12)}…? This action cannot be undone.`}
        confirmLabel="Cancel Execution"
        destructive
      />
    </div>
  );
}
