'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  PageHeader,
  Badge,
  Button,
  Card,
  Tabs,
  DataTable,
  StatusDot,
  Skeleton,
  QuotaBar,
  useToast,
  type ColumnDef,
} from '@solar/ui';
import type { Agent, Task, PaginatedResponse } from '@solar/api';
import { solar } from '../solarApi';
import { ArrowLeft, TrendingUp, Wrench, Settings, GitBranch, History } from 'lucide-react';

// ─── Quality chart (simple SVG bar chart) ─────────────────────────────────────

function QualityChart({ scores }: { scores: number[] }) {
  const barWidth = 24;
  const gap = 4;
  const height = 100;
  const w = scores.length * (barWidth + gap);

  return (
    <svg width={w} height={height + 20} style={{ display: 'block' }}>
      {scores.map((s, i) => {
        const barH = s * height;
        const color = s >= 0.9 ? 'var(--color-aura-green)' : s >= 0.7 ? 'var(--color-aura-yellow)' : 'var(--color-aura-red)';
        return (
          <g key={i}>
            <rect x={i * (barWidth + gap)} y={height - barH} width={barWidth} height={barH} fill={color} rx={3} opacity={0.85} />
            <text x={i * (barWidth + gap) + barWidth / 2} y={height + 14} textAnchor="middle" fontSize="9" fill="var(--color-solar-text-secondary)">
              {(s * 100).toFixed(0)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Execution History columns ────────────────────────────────────────────────

const EXEC_COLUMNS: ColumnDef<Record<string, unknown>>[] = [
  { key: 'task_id', header: 'Task ID', cell: (v) => <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{String(v).slice(0, 12)}...</span> },
  { key: 'status', header: 'Status', cell: (v) => { const s = String(v); return <Badge variant={s === 'success' ? 'success' : s === 'running' ? 'info' : s === 'failed' ? 'error' : 'default'}>{s}</Badge>; } },
  { key: 'created_at', header: 'Started', cell: (v) => <span style={{ fontSize: '0.75rem', color: 'var(--color-solar-text-secondary)' }}>{new Date(String(v)).toLocaleString()}</span> },
];

// ─── Main Component ───────────────────────────────────────────────────────────

interface AgentDetailProps {
  agentId: string;
  onBack?: () => void;
}

export function AgentDetail({ agentId, onBack }: AgentDetailProps) {
  const [activeTab, setActiveTab] = useState('performance');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: agent, isLoading } = useQuery<Agent>({
    queryKey: ['agents', 'detail', agentId],
    queryFn: () => solar.sun.agents.get(agentId),
    enabled: !!agentId,
  });

  const { data: executions } = useQuery<PaginatedResponse<Record<string, unknown>>>({
    queryKey: ['agents', 'executions', agentId],
    queryFn: () => solar.mars.executions.list({ page: 1, page_size: 10 }),
    enabled: !!agentId,
  });

  const promoteMutation = useMutation({
    mutationFn: (status: string) => solar.sun.agents.update(agentId, { status } as any),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['agents'] }); toast({ title: 'Agent status updated', type: 'success' }); },
  });

  const deprecateMutation = useMutation({
    mutationFn: () => solar.sun.agents.deprecate(agentId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['agents'] }); toast({ title: 'Agent deprecated', type: 'warning' }); },
  });

  if (isLoading || !agent) {
    return (
      <div style={{ padding: '2rem' }}>
        <Skeleton lines={12} height="40px" />
      </div>
    );
  }

  const demoScores = [0.72, 0.78, 0.81, 0.85, 0.83, 0.88, 0.91, agent.quality_score];
  const statusColor = agent.status === 'active' ? 'success' : agent.status === 'canary' ? 'warning' : agent.status === 'deprecated' ? 'default' : 'error';

  const tabs = [
    { id: 'performance', label: 'Performance', icon: <TrendingUp size={14} /> },
    { id: 'skills', label: 'Skills', icon: <Wrench size={14} /> },
    { id: 'config', label: 'Configuration', icon: <Settings size={14} /> },
    { id: 'promotion', label: 'Promotion Pipeline', icon: <GitBranch size={14} /> },
    { id: 'history', label: 'Execution History', icon: <History size={14} /> },
  ];

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
        {onBack && <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft size={16} /></Button>}
        <div style={{ flex: 1 }}>
          <PageHeader
            title={agent.display_name}
            description={agent.description || `Agent ${agent.agent_id}`}
            actions={
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <Badge variant={(({ nano: 'default', standard: 'info', advanced: 'success', specialized: 'warning', ops_only: 'error' } as any)[agent.tier])}>{agent.tier}</Badge>
                <Badge variant={agent.trust_tier === 'system' ? 'success' : 'info'}>{agent.trust_tier}</Badge>
                <Badge variant={statusColor}>{agent.status}</Badge>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-solar-text-secondary)' }}>v{agent.version}</span>
              </div>
            }
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab Content */}
      {activeTab === 'performance' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <Card title="Quality Score Trend">
            <div style={{ padding: '1rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <span style={{ fontSize: '2rem', fontWeight: 700, color: agent.quality_score >= 0.9 ? 'var(--color-aura-green)' : agent.quality_score >= 0.7 ? 'var(--color-aura-yellow)' : 'var(--color-aura-red)' }}>
                  {(agent.quality_score * 100).toFixed(1)}%
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-solar-text-secondary)', marginLeft: '0.5rem' }}>current score</span>
              </div>
              <QualityChart scores={demoScores} />
            </div>
          </Card>
          <Card title="Execution Metrics">
            <div style={{ padding: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-solar-text-secondary)' }}>Total Executions</p>
                <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-solar-text-primary)' }}>{executions?.total ?? 0}</p>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-solar-text-secondary)' }}>Success Rate</p>
                <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-aura-green)' }}>94.2%</p>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-solar-text-secondary)' }}>Avg Duration</p>
                <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-solar-text-primary)' }}>3.2s</p>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-solar-text-secondary)' }}>Last Active</p>
                <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-solar-text-primary)' }}>{new Date(agent.registered_at).toLocaleDateString()}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'skills' && (
        <Card title="Assigned Skills">
          <div style={{ padding: '1rem' }}>
            {agent.skills.length === 0 ? (
              <p style={{ color: 'var(--color-solar-text-secondary)', fontSize: '0.875rem' }}>No skills assigned.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {agent.skills.map(skill => (
                  <div key={skill} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'var(--color-solar-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-solar-border)' }}>
                    <Wrench size={14} style={{ color: 'var(--color-planet-sun)' }} />
                    <span style={{ fontWeight: 500, color: 'var(--color-solar-text-primary)', fontSize: '0.875rem' }}>{skill}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {activeTab === 'config' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Card title="Budget Defaults">
            <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {agent.default_budget && Object.entries(agent.default_budget).map(([key, dim]) => (
                <div key={key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--color-solar-text-primary)', textTransform: 'capitalize' }}>{key.replace('_', ' ')}</span>
                    <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--color-solar-text-secondary)' }}>{(dim as any)?.limit ?? 'N/A'} ({(dim as any)?.mode ?? 'N/A'})</span>
                  </div>
                  <QuotaBar used={0} limit={(dim as any)?.limit ?? 100} label="" />
                </div>
              ))}
              {(!agent.default_budget || Object.keys(agent.default_budget).length === 0) && (
                <p style={{ color: 'var(--color-solar-text-secondary)', fontSize: '0.875rem' }}>No custom budget defaults configured.</p>
              )}
            </div>
          </Card>
          <Card title="Configuration Details">
            <div style={{ padding: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div><span style={{ fontSize: '0.75rem', color: 'var(--color-solar-text-secondary)' }}>Privilege Mode</span><p style={{ margin: 0, fontWeight: 500 }}>{agent.privilege_mode}</p></div>
              <div><span style={{ fontSize: '0.75rem', color: 'var(--color-solar-text-secondary)' }}>Image</span><p style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{agent.image_ref}</p></div>
              <div><span style={{ fontSize: '0.75rem', color: 'var(--color-solar-text-secondary)' }}>Lifecycle Types</span><p style={{ margin: 0 }}>{agent.lifecycle_types.join(', ')}</p></div>
              <div><span style={{ fontSize: '0.75rem', color: 'var(--color-solar-text-secondary)' }}>Side Effects</span><p style={{ margin: 0 }}>{agent.side_effects.length > 0 ? agent.side_effects.join(', ') : 'None'}</p></div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'promotion' && (
        <Card title="Promotion Pipeline">
          <div style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
              {(['active', 'canary', 'deprecated', 'retired'] as const).map((stage, i) => (
                <div key={stage} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '120px', padding: '0.75rem', textAlign: 'center', borderRadius: 'var(--radius-md)', border: agent.status === stage ? '2px solid var(--color-planet-sun)' : '1px solid var(--color-solar-border)', background: agent.status === stage ? 'var(--color-solar-surface)' : 'transparent' }}>
                    <StatusDot status={stage === 'active' ? 'healthy' : stage === 'canary' ? 'degraded' : 'unreachable'} label={stage} />
                  </div>
                  {i < 3 && <span style={{ color: 'var(--color-solar-text-secondary)' }}>→</span>}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {agent.status === 'canary' && <Button variant="primary" size="sm" onClick={() => promoteMutation.mutate('active')}>Promote to Active</Button>}
              {agent.status === 'active' && <Button variant="secondary" size="sm" onClick={() => promoteMutation.mutate('canary')}>Move to Canary</Button>}
              {agent.status !== 'deprecated' && agent.status !== 'retired' && <Button variant="ghost" size="sm" onClick={() => deprecateMutation.mutate()}>Deprecate</Button>}
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'history' && (
        <Card title="Recent Executions">
          <DataTable
            columns={EXEC_COLUMNS}
            data={executions?.items ?? []}
            emptyMessage="No execution history found for this agent."
          />
        </Card>
      )}
    </div>
  );
}
