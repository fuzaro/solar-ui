'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  PageHeader,
  DataTable,
  Badge,
  Card,
  StatsCard,
  Input,
  Skeleton,
  type ColumnDef,
} from '@solar/ui';
import type { QualityGateResult } from '@solar/api';
import { solar } from '../solarApi';
import { Providers } from '../Providers';
import { Shield, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface GateConfig {
  gate: string;
  description: string;
  threshold: number;
  pass_count: number;
  warn_count: number;
  fail_count: number;
}

// ─── Gate Definitions ─────────────────────────────────────────────────────────

const GATE_DEFINITIONS: Record<string, { description: string; defaultThreshold: number }> = {
  safety: { description: 'Ensures output does not contain harmful, illegal, or dangerous content', defaultThreshold: 0.95 },
  pii: { description: 'Detects and flags personally identifiable information in outputs', defaultThreshold: 0.99 },
  schema: { description: 'Validates output structure matches expected JSON schema', defaultThreshold: 1.0 },
  completion: { description: 'Checks that the task was fully completed without truncation', defaultThreshold: 0.90 },
  confidence: { description: 'Verifies model confidence meets minimum threshold for delivery', defaultThreshold: 0.70 },
  regression: { description: 'Compares output quality against historical baseline for the skill', defaultThreshold: 0.85 },
};

// ─── Columns ──────────────────────────────────────────────────────────────────

const GATE_COLUMNS: ColumnDef<GateConfig>[] = [
  {
    key: 'gate',
    header: 'Gate',
    cell: (v) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Shield size={14} style={{ color: 'var(--color-planet-themis)' }} />
        <span style={{ fontWeight: 600, color: 'var(--color-solar-text-primary)', textTransform: 'capitalize' }}>{String(v)}</span>
      </div>
    ),
  },
  {
    key: 'description',
    header: 'Description',
    cell: (v) => <span style={{ fontSize: '0.8125rem', color: 'var(--color-solar-text-secondary)' }}>{String(v)}</span>,
  },
  {
    key: 'pass_count',
    header: 'Pass',
    cell: (v) => <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-aura-green)', fontWeight: 600 }}>{String(v)}</span>,
  },
  {
    key: 'warn_count',
    header: 'Warn',
    cell: (v) => <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-aura-yellow)', fontWeight: 600 }}>{String(v)}</span>,
  },
  {
    key: 'fail_count',
    header: 'Fail',
    cell: (v) => <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-aura-red)', fontWeight: 600 }}>{String(v)}</span>,
  },
  {
    key: 'threshold',
    header: 'Threshold',
    cell: (v) => <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>{(Number(v) * 100).toFixed(0)}%</span>,
  },
];

// ─── Recent Results Columns ───────────────────────────────────────────────────

interface GateResultRow {
  gate: string;
  result: string;
  detail: string;
  task_id: string;
  time: string;
}

const RESULT_COLUMNS: ColumnDef<GateResultRow>[] = [
  {
    key: 'gate',
    header: 'Gate',
    cell: (v) => <Badge variant="default">{String(v)}</Badge>,
  },
  {
    key: 'result',
    header: 'Result',
    cell: (v) => {
      const r = String(v);
      const icon = r === 'pass' ? <CheckCircle size={12} /> : r === 'warn' ? <AlertTriangle size={12} /> : <XCircle size={12} />;
      const color = r === 'pass' ? 'var(--color-aura-green)' : r === 'warn' ? 'var(--color-aura-yellow)' : 'var(--color-aura-red)';
      return <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color, fontWeight: 500 }}>{icon} {r}</span>;
    },
  },
  {
    key: 'detail',
    header: 'Detail',
    cell: (v) => <span style={{ fontSize: '0.8125rem', color: 'var(--color-solar-text-secondary)' }}>{String(v || '—')}</span>,
  },
  {
    key: 'task_id',
    header: 'Task',
    cell: (v) => <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>{String(v).slice(0, 12)}...</span>,
  },
  {
    key: 'time',
    header: 'Time',
    cell: (v) => <span style={{ fontSize: '0.75rem', color: 'var(--color-solar-text-secondary)' }}>{String(v)}</span>,
  },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export function QualityGates() {
  return (
    <Providers>
      <QualityGatesContent />
    </Providers>
  );
}

function QualityGatesContent() {
  const [filterOutcome, setFilterOutcome] = useState<string>('');

  const { data: executions, isLoading } = useQuery({
    queryKey: ['quality', 'gates', 'data'],
    queryFn: async () => {
      const result = await solar.mars.executions.list({ page: 1, page_size: 50 });
      return result.items;
    },
    refetchInterval: 30_000,
  });

  // Aggregate gate results from execution data
  const gateStats: Record<string, { pass: number; warn: number; fail: number }> = {};
  Object.keys(GATE_DEFINITIONS).forEach(g => { gateStats[g] = { pass: 0, warn: 0, fail: 0 }; });

  const recentResults: GateResultRow[] = [];

  (executions ?? []).forEach((exec: any) => {
    const gates = exec.quality_metadata?.gates ?? exec.gates ?? [];
    gates.forEach((g: QualityGateResult) => {
      if (gateStats[g.gate]) {
        gateStats[g.gate][g.result]++;
      }
      recentResults.push({
        gate: g.gate,
        result: g.result,
        detail: g.detail ?? '',
        task_id: exec.task_id ?? exec.exec_id ?? '',
        time: new Date(exec.created_at ?? Date.now()).toLocaleString(),
      });
    });
  });

  const gateConfigs: GateConfig[] = Object.entries(GATE_DEFINITIONS).map(([gate, def]) => ({
    gate,
    description: def.description,
    threshold: def.defaultThreshold,
    pass_count: gateStats[gate]?.pass ?? 0,
    warn_count: gateStats[gate]?.warn ?? 0,
    fail_count: gateStats[gate]?.fail ?? 0,
  }));

  const totalPass = gateConfigs.reduce((s, g) => s + g.pass_count, 0);
  const totalWarn = gateConfigs.reduce((s, g) => s + g.warn_count, 0);
  const totalFail = gateConfigs.reduce((s, g) => s + g.fail_count, 0);

  const filteredResults = filterOutcome
    ? recentResults.filter(r => r.result === filterOutcome)
    : recentResults;

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <PageHeader
        title="Quality Gates"
        description="Monitor quality gate outcomes, thresholds, and recent check results."
      />

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
        <StatsCard label="Pass" value={totalPass} icon={<CheckCircle size={20} />} planet="sun" />
        <StatsCard label="Warn" value={totalWarn} icon={<AlertTriangle size={20} />} planet="saturn" />
        <StatsCard label="Fail" value={totalFail} icon={<XCircle size={20} />} planet="mars" />
        <StatsCard label="Total Checks" value={totalPass + totalWarn + totalFail} icon={<Shield size={20} />} planet="themis" />
      </div>

      {/* Gate Overview Table */}
      {isLoading ? (
        <Skeleton lines={6} height="40px" />
      ) : (
        <>
          <Card title="Gate Overview">
            <DataTable<GateConfig>
              columns={GATE_COLUMNS}
              data={gateConfigs}
              emptyMessage="No gate data available."
            />
          </Card>

          {/* Threshold Editor */}
          <Card title="Threshold Configuration">
            <div style={{ padding: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
              {gateConfigs.map(g => (
                <div key={g.gate} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 500, textTransform: 'capitalize' }}>{g.gate}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-planet-themis)' }}>{(g.threshold * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    defaultValue={g.threshold}
                    style={{ width: '100%', accentColor: 'var(--color-planet-themis)' }}
                  />
                </div>
              ))}
            </div>
          </Card>

          {/* Recent Results */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-solar-text-primary)', margin: 0 }}>Recent Results</p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {['', 'pass', 'warn', 'fail'].map(o => (
                  <button
                    key={o}
                    onClick={() => setFilterOutcome(o)}
                    style={{
                      background: filterOutcome === o ? 'var(--color-solar-surface)' : 'transparent',
                      border: '1px solid var(--color-solar-border)',
                      borderRadius: '4px',
                      padding: '0.25rem 0.625rem',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      color: 'var(--color-solar-text-primary)',
                      fontWeight: filterOutcome === o ? 600 : 400,
                    }}
                  >
                    {o || 'All'}
                  </button>
                ))}
              </div>
            </div>
            <DataTable<GateResultRow>
              columns={RESULT_COLUMNS}
              data={filteredResults.slice(0, 20)}
              emptyMessage="No gate results found."
            />
          </div>
        </>
      )}
    </div>
  );
}
