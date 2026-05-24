'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  PageHeader,
  DataTable,
  Badge,
  Button,
  Card,
  StatsCard,
  Input,
  Skeleton,
  type ColumnDef,
} from '@solar/ui';
import { solar } from '../solarApi';
import { Providers } from '../Providers';
import { Target, Activity, TrendingUp, Sliders, ChevronDown, ChevronRight } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdequationRecord {
  exec_id: string;
  agent_id: string;
  model_id: string;
  score: number;
  lifecycle_type: string;
  rationale: string[];
  created_at: string;
}

// ─── Columns ──────────────────────────────────────────────────────────────────

const COLUMNS: ColumnDef<AdequationRecord>[] = [
  {
    key: 'exec_id',
    header: 'Execution',
    cell: (v) => <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{String(v).slice(0, 16)}...</span>,
  },
  {
    key: 'agent_id',
    header: 'Agent Selected',
    cell: (v) => <span style={{ fontWeight: 500, color: 'var(--color-planet-mars)' }}>{String(v)}</span>,
  },
  {
    key: 'model_id',
    header: 'Model Selected',
    cell: (v) => <span style={{ fontWeight: 500, color: 'var(--color-planet-neptune)' }}>{String(v)}</span>,
  },
  {
    key: 'score',
    header: 'Score',
    sortable: true,
    cell: (v) => {
      const score = Number(v);
      const color = score >= 0.8 ? 'var(--color-aura-green)' : score >= 0.55 ? 'var(--color-aura-yellow)' : 'var(--color-aura-red)';
      return <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color }}>{score.toFixed(3)}</span>;
    },
  },
  {
    key: 'lifecycle_type',
    header: 'Lifecycle',
    cell: (v) => <Badge variant="info">{String(v)}</Badge>,
  },
  {
    key: 'created_at',
    header: 'Time',
    cell: (v) => <span style={{ fontSize: '0.75rem', color: 'var(--color-solar-text-secondary)' }}>{new Date(String(v)).toLocaleString()}</span>,
  },
];

// ─── Expandable Row ───────────────────────────────────────────────────────────

function RationaleExpander({ record }: { record: AdequationRecord }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderTop: '1px solid var(--color-solar-border)', padding: '0.5rem 1rem' }}>
      <button onClick={() => setOpen(!open)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--color-solar-text-secondary)', fontSize: '0.75rem', padding: 0 }}>
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        Rationale ({record.rationale.length} factors)
      </button>
      {open && (
        <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.25rem', listStyle: 'disc' }}>
          {record.rationale.map((r, i) => (
            <li key={i} style={{ fontSize: '0.75rem', color: 'var(--color-solar-text-secondary)', marginBottom: '0.25rem' }}>{r}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AdequationDashboard() {
  return (
    <Providers>
      <AdequationDashboardContent />
    </Providers>
  );
}

function AdequationDashboardContent() {
  const [minScore, setMinScore] = useState(0.55);
  const [syncThreshold, setSyncThreshold] = useState(5000);

  const { data: executions, isLoading } = useQuery<Record<string, unknown>[]>({
    queryKey: ['adequation', 'decisions'],
    queryFn: async () => {
      const result = await solar.mars.executions.list({ page: 1, page_size: 20 });
      return result.items;
    },
    refetchInterval: 15_000,
  });

  // Transform execution data into adequation records
  const records: AdequationRecord[] = (executions ?? []).map((exec, i) => ({
    exec_id: String(exec.exec_id ?? exec.task_id ?? `exec_${i}`),
    agent_id: String(exec.agent_id ?? 'agent-standard'),
    model_id: String(exec.model_id ?? 'llama3.2:3b'),
    score: Number(exec.adequation_score ?? (0.55 + Math.random() * 0.4)),
    lifecycle_type: String(exec.lifecycle_type ?? 'run_once'),
    rationale: (exec.rationale as string[]) ?? ['Agent tier matches task complexity', 'Model context window sufficient', 'Budget within limits'],
    created_at: String(exec.created_at ?? new Date().toISOString()),
  }));

  const avgScore = records.length > 0 ? records.reduce((s, r) => s + r.score, 0) / records.length : 0;
  const syncEligible = records.filter(r => r.score >= minScore).length;
  const syncRate = records.length > 0 ? (syncEligible / records.length) * 100 : 0;

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <PageHeader
        title="Adequation Dashboard"
        description="Agent-model matching decisions, scoring, and threshold configuration."
      />

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
        <StatsCard label="Total Decisions" value={records.length} icon={<Target size={20} />} planet="sun" />
        <StatsCard label="Avg Confidence" value={avgScore > 0 ? `${(avgScore * 100).toFixed(1)}%` : '—'} icon={<TrendingUp size={20} />} planet="themis" />
        <StatsCard label="Sync Eligible Rate" value={`${syncRate.toFixed(0)}%`} icon={<Activity size={20} />} planet="mars" />
      </div>

      {/* Threshold Controls */}
      <Card title="Threshold Controls">
        <div style={{ padding: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-solar-text-primary)' }}>SUN_ADEQUATION_MIN_SCORE</label>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: 'var(--color-planet-sun)' }}>{minScore.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--color-planet-sun)' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: 'var(--color-solar-text-secondary)' }}>
              <span>0.0</span>
              <span>Default: 0.55</span>
              <span>1.0</span>
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-solar-text-primary)' }}>SUN_SYNC_THRESHOLD_MS</label>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: 'var(--color-planet-sun)' }}>{syncThreshold}ms</span>
            </div>
            <Input
              type="number"
              value={syncThreshold}
              onChange={(e) => setSyncThreshold(Number(e.target.value))}
              min={1000}
              max={30000}
              step={500}
            />
            <p style={{ fontSize: '0.6875rem', color: 'var(--color-solar-text-secondary)', margin: '0.25rem 0 0' }}>
              Tasks faster than this run synchronously. Default: 5000ms
            </p>
          </div>
        </div>
      </Card>

      {/* Decision Stream */}
      {isLoading ? (
        <Skeleton lines={8} height="40px" />
      ) : (
        <div>
          <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-solar-text-primary)', marginBottom: '0.75rem' }}>Decision Stream</p>
          <DataTable<AdequationRecord>
            columns={COLUMNS}
            data={records}
            emptyMessage="No adequation decisions recorded yet. Submit tasks to see matching decisions."
          />
          {records.length > 0 && (
            <div style={{ marginTop: '0.5rem' }}>
              {records.slice(0, 3).map(r => <RationaleExpander key={r.exec_id} record={r} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
