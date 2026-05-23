'use client';

import { useQuery } from '@tanstack/react-query';
import {
  PageHeader,
  DataTable,
  Badge,
  Card,
  StatsCard,
  Skeleton,
  type ColumnDef,
} from '@solar/ui';
import type { ModelQuality } from '@solar/api';
import { solar } from '../solarApi';
import { BarChart3, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

// ─── SVG Bar Chart ────────────────────────────────────────────────────────────

function HorizontalBar({ label, value, max = 1, color }: { label: string; value: number; max?: number; color: string }) {
  const pct = (value / max) * 100;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.375rem 0' }}>
      <span style={{ fontSize: '0.8125rem', color: 'var(--color-solar-text-primary)', width: '140px', flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: '8px', background: 'var(--color-solar-border)', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '4px' }} />
      </div>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color, width: '50px', textAlign: 'right' }}>{(value * 100).toFixed(1)}%</span>
    </div>
  );
}

// ─── Model Quality Columns ────────────────────────────────────────────────────

const QUALITY_COLUMNS: ColumnDef<ModelQuality>[] = [
  {
    key: 'model_id',
    header: 'Model',
    sortable: true,
    cell: (v) => <span style={{ fontWeight: 500, color: 'var(--color-solar-text-primary)' }}>{String(v)}</span>,
  },
  {
    key: 'quality_score',
    header: 'Quality Score',
    sortable: true,
    cell: (v) => {
      const score = Number(v);
      const color = score >= 0.9 ? 'var(--color-aura-green)' : score >= 0.7 ? 'var(--color-aura-yellow)' : 'var(--color-aura-red)';
      return <span style={{ fontWeight: 700, fontSize: '0.875rem', fontFamily: 'var(--font-mono)', color }}>{(score * 100).toFixed(1)}%</span>;
    },
  },
  {
    key: 'tool_success_rate',
    header: 'Tool Success',
    sortable: true,
    cell: (v) => {
      const val = Number(v);
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '60px', height: '6px', background: 'var(--color-solar-border)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${val * 100}%`, height: '100%', background: val >= 0.9 ? 'var(--color-aura-green)' : 'var(--color-aura-yellow)', borderRadius: '3px' }} />
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{(val * 100).toFixed(0)}%</span>
        </div>
      );
    },
  },
  {
    key: 'non_hallucination',
    header: 'Non-Hallucination',
    sortable: true,
    cell: (v) => {
      const val = Number(v);
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '60px', height: '6px', background: 'var(--color-solar-border)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${val * 100}%`, height: '100%', background: val >= 0.95 ? 'var(--color-aura-green)' : val >= 0.85 ? 'var(--color-aura-yellow)' : 'var(--color-aura-red)', borderRadius: '3px' }} />
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{(val * 100).toFixed(1)}%</span>
        </div>
      );
    },
  },
  {
    key: 'sample_count',
    header: 'Samples',
    sortable: true,
    cell: (v) => <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>{Number(v).toLocaleString()}</span>,
  },
  {
    key: 'last_updated',
    header: 'Last Updated',
    cell: (v) => <span style={{ fontSize: '0.75rem', color: 'var(--color-solar-text-secondary)' }}>{new Date(String(v)).toLocaleDateString()}</span>,
  },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export function QualityAnalytics() {
  const { data: qualities, isLoading } = useQuery<ModelQuality[]>({
    queryKey: ['models', 'quality', 'all'],
    queryFn: () => solar.neptune.models.listQuality(),
    refetchInterval: 60_000,
  });

  if (isLoading) {
    return <div style={{ padding: '2rem' }}><Skeleton lines={12} height="40px" /></div>;
  }

  const sorted = [...(qualities ?? [])].sort((a, b) => b.quality_score - a.quality_score);
  const avgQuality = sorted.length > 0 ? sorted.reduce((s, m) => s + m.quality_score, 0) / sorted.length : 0;
  const avgToolSuccess = sorted.length > 0 ? sorted.reduce((s, m) => s + m.tool_success_rate, 0) / sorted.length : 0;
  const avgNonHallucination = sorted.length > 0 ? sorted.reduce((s, m) => s + m.non_hallucination, 0) / sorted.length : 0;
  const totalSamples = sorted.reduce((s, m) => s + m.sample_count, 0);

  // Tier breakdown (simulated from model quality data)
  const tierGroups: Record<string, ModelQuality[]> = {};
  sorted.forEach(m => {
    const tier = m.model_id.includes('nano') ? 'nano' : m.model_id.includes('advanced') ? 'advanced' : m.model_id.includes('specialized') ? 'specialized' : 'standard';
    if (!tierGroups[tier]) tierGroups[tier] = [];
    tierGroups[tier].push(m);
  });

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <PageHeader
        title="Quality Analytics"
        description="Model quality rankings, hallucination rates, and tool success metrics."
      />

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
        <StatsCard label="Avg Quality Score" value={`${(avgQuality * 100).toFixed(1)}%`} icon={<BarChart3 size={20} />} planet="neptune" />
        <StatsCard label="Avg Tool Success" value={`${(avgToolSuccess * 100).toFixed(1)}%`} icon={<CheckCircle size={20} />} planet="sun" />
        <StatsCard label="Avg Non-Hallucination" value={`${(avgNonHallucination * 100).toFixed(1)}%`} icon={<AlertTriangle size={20} />} planet="themis" />
        <StatsCard label="Total Samples" value={totalSamples.toLocaleString()} icon={<TrendingUp size={20} />} planet="moon" />
      </div>

      {/* Tier Breakdown */}
      <Card title="Quality by Tier">
        <div style={{ padding: '1rem' }}>
          {Object.entries(tierGroups).map(([tier, models]) => {
            const avg = models.reduce((s, m) => s + m.quality_score, 0) / models.length;
            const color = avg >= 0.9 ? 'var(--color-aura-green)' : avg >= 0.7 ? 'var(--color-aura-yellow)' : 'var(--color-aura-red)';
            return <HorizontalBar key={tier} label={`${tier} (${models.length} models)`} value={avg} color={color} />;
          })}
          {Object.keys(tierGroups).length === 0 && (
            <p style={{ color: 'var(--color-solar-text-secondary)', fontSize: '0.875rem' }}>No quality data available yet.</p>
          )}
        </div>
      </Card>

      {/* Tool Success Rate Comparison */}
      <Card title="Tool Success Rate Comparison">
        <div style={{ padding: '1rem' }}>
          {sorted.slice(0, 10).map(m => (
            <HorizontalBar key={m.model_id} label={m.model_id} value={m.tool_success_rate} color="var(--color-planet-neptune)" />
          ))}
        </div>
      </Card>

      {/* Full ranking table */}
      <div>
        <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-solar-text-primary)', marginBottom: '0.75rem' }}>Model Quality Ranking</p>
        <DataTable<ModelQuality>
          columns={QUALITY_COLUMNS}
          data={sorted}
          emptyMessage="No quality data available. Run inference tasks to generate quality scores."
        />
      </div>
    </div>
  );
}
