'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  PageHeader,
  Badge,
  Button,
  Card,
  Tabs,
  DataTable,
  Input,
  Textarea,
  FormField,
  Skeleton,
  useToast,
  type ColumnDef,
} from '@solar/ui';
import type { Model, ModelQuality } from '@solar/api';
import { solar } from '../solarApi';
import { Providers } from '../Providers';
import { ArrowLeft, BarChart3, Settings, Activity } from 'lucide-react';

// ─── SVG Line Chart ───────────────────────────────────────────────────────────

function LineChart({ data, width = 320, height = 120, color = 'var(--color-planet-neptune)' }: { data: number[]; width?: number; height?: number; color?: string }) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const step = width / (data.length - 1);

  const points = data.map((v, i) => `${i * step},${height - ((v - min) / range) * height}`).join(' ');
  const areaPoints = `0,${height} ${points} ${(data.length - 1) * step},${height}`;

  return (
    <svg width={width} height={height + 20} style={{ display: 'block' }}>
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill="url(#chartGrad)" />
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((v, i) => (
        <circle key={i} cx={i * step} cy={height - ((v - min) / range) * height} r="3" fill={color} />
      ))}
    </svg>
  );
}

// ─── Quality Feedback Schema ──────────────────────────────────────────────────

const feedbackSchema = z.object({
  quality_rating: z.coerce.number().min(0).max(1),
  notes: z.string().max(500).optional(),
});

// ─── Main Component ───────────────────────────────────────────────────────────

interface ModelDetailProps {
  modelId: string;
  onBack?: () => void;
}

export function ModelDetail(props: ModelDetailProps) {
  return (
    <Providers>
      <ModelDetailContent {...props} />
    </Providers>
  );
}

function ModelDetailContent({ modelId, onBack }: ModelDetailProps) {
  const [activeTab, setActiveTab] = useState('quality');
  const { toast } = useToast();

  const { data: model, isLoading } = useQuery<Model>({
    queryKey: ['models', 'detail', modelId],
    queryFn: () => solar.neptune.models.get(modelId),
    enabled: !!modelId,
  });

  const { data: quality } = useQuery<ModelQuality>({
    queryKey: ['models', 'quality', modelId],
    queryFn: () => solar.neptune.models.getQuality(modelId),
    enabled: !!modelId,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(feedbackSchema),
    defaultValues: { quality_rating: 0.8, notes: '' },
  });

  if (isLoading || !model) {
    return <div style={{ padding: '2rem' }}><Skeleton lines={12} height="40px" /></div>;
  }

  const tierColors: Record<string, string> = { nano: 'default', standard: 'info', advanced: 'success', specialized: 'warning' };
  const demoQualityTrend = [0.72, 0.75, 0.78, 0.82, 0.79, 0.84, 0.87, quality?.quality_score ?? 0.85];

  const tabs = [
    { id: 'quality', label: 'Quality', icon: <BarChart3 size={14} /> },
    { id: 'config', label: 'Configuration', icon: <Settings size={14} /> },
    { id: 'usage', label: 'Usage', icon: <Activity size={14} /> },
  ];

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
        {onBack && <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft size={16} /></Button>}
        <div style={{ flex: 1 }}>
          <PageHeader
            title={model.display_name}
            description={`Provider: ${model.provider_id} · Context: ${(model.context_window / 1024).toFixed(0)}K`}
            actions={
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <Badge variant={(tierColors[model.tier] || 'default') as any}>{model.tier}</Badge>
                <Badge variant={model.status === 'available' ? 'success' : 'error'}>{model.status}</Badge>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: 'var(--color-planet-neptune)', fontWeight: 600 }}>
                  P{model.priority}
                </span>
              </div>
            }
          />
        </div>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'quality' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {/* Score Breakdown */}
          <Card title="Quality Score Breakdown">
            <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-planet-neptune)' }}>
                  {((quality?.quality_score ?? model.quality_score) * 100).toFixed(1)}%
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-solar-text-secondary)' }}>
                  {quality?.sample_count ?? 0} samples
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <MetricBar label="Tool Success Rate" value={quality?.tool_success_rate ?? 0.9} />
                <MetricBar label="Non-Hallucination Rate" value={quality?.non_hallucination ?? 0.95} />
              </div>
              {quality?.last_updated && (
                <p style={{ margin: 0, fontSize: '0.6875rem', color: 'var(--color-solar-text-secondary)' }}>
                  Last updated: {new Date(quality.last_updated).toLocaleString()}
                </p>
              )}
            </div>
          </Card>

          {/* Score Trend */}
          <Card title="Score Trend">
            <div style={{ padding: '1rem' }}>
              <LineChart data={demoQualityTrend} width={300} height={120} color="var(--color-planet-neptune)" />
            </div>
          </Card>

          {/* Feedback Form */}
          <Card title="Submit Quality Feedback" style={{ gridColumn: '1 / -1' }}>
            <form onSubmit={handleSubmit((data) => { toast({ title: 'Feedback submitted', description: `Rating: ${data.quality_rating}`, type: 'success' }); reset(); })} style={{ padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
              <FormField label="Quality Rating (0-1)" error={errors.quality_rating?.message} style={{ flex: '0 0 140px' }}>
                <Input {...register('quality_rating')} type="number" step="0.01" min="0" max="1" />
              </FormField>
              <FormField label="Notes" error={errors.notes?.message} style={{ flex: 1 }}>
                <Input {...register('notes')} placeholder="Observation about model quality..." />
              </FormField>
              <Button type="submit" variant="primary" size="sm">Submit</Button>
            </form>
          </Card>
        </div>
      )}

      {activeTab === 'config' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <Card title="Model Configuration">
            <div style={{ padding: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <DetailItem label="Model ID" value={model.model_id} mono />
              <DetailItem label="Provider" value={model.provider_id} />
              <DetailItem label="Tier" value={model.tier} />
              <DetailItem label="Context Window" value={`${model.context_window.toLocaleString()} tokens`} />
              <DetailItem label="Priority" value={String(model.priority)} />
              <DetailItem label="Status" value={model.status} />
            </div>
          </Card>
          <Card title="Capabilities">
            <div style={{ padding: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {model.capabilities.length > 0 ? model.capabilities.map(c => (
                <Badge key={c} variant="info">{c}</Badge>
              )) : (
                <span style={{ color: 'var(--color-solar-text-secondary)', fontSize: '0.875rem' }}>No capabilities tagged.</span>
              )}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'usage' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          <Card title="Inference Calls">
            <div style={{ padding: '1rem', textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: '2rem', fontWeight: 700, color: 'var(--color-solar-text-primary)' }}>1,247</p>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-solar-text-secondary)' }}>Last 24h</p>
            </div>
          </Card>
          <Card title="Avg Latency">
            <div style={{ padding: '1rem', textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: '2rem', fontWeight: 700, color: 'var(--color-solar-text-primary)' }}>340ms</p>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-solar-text-secondary)' }}>p50 response time</p>
            </div>
          </Card>
          <Card title="Token Usage">
            <div style={{ padding: '1rem', textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: '2rem', fontWeight: 700, color: 'var(--color-solar-text-primary)' }}>2.4M</p>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-solar-text-secondary)' }}>tokens processed today</p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function MetricBar({ label, value }: { label: string; value: number }) {
  const pct = value * 100;
  const color = pct >= 90 ? 'var(--color-aura-green)' : pct >= 70 ? 'var(--color-aura-yellow)' : 'var(--color-aura-red)';
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
        <span style={{ fontSize: '0.8125rem', color: 'var(--color-solar-text-primary)' }}>{label}</span>
        <span style={{ fontSize: '0.8125rem', fontFamily: 'var(--font-mono)', color }}>{pct.toFixed(1)}%</span>
      </div>
      <div style={{ height: '6px', background: 'var(--color-solar-border)', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '3px', transition: 'width 0.3s' }} />
      </div>
    </div>
  );
}

function DetailItem({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p style={{ margin: 0, fontSize: '0.6875rem', color: 'var(--color-solar-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</p>
      <p style={{ margin: '0.125rem 0 0', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-solar-text-primary)', ...(mono && { fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }) }}>{value}</p>
    </div>
  );
}
