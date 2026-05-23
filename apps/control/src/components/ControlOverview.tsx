'use client';

import { useQuery } from '@tanstack/react-query';
import {
  PageHeader,
  StatsCard,
  DataTable,
  Badge,
  Button,
  Card,
  SolarSystemMap,
  StatusDot,
  AlertBanner,
  Skeleton,
  type ColumnDef,
} from '@solar/ui';
import {
  type Agent,
  type Model,
  type PaginatedResponse,
  type AuraBand,
  type PlanetId,
  type HealthResponse,
} from '@solar/api';
import { solar } from './solarApi';
import {
  Bot,
  Cpu,
  Activity,
  Users,
  Star,
  AlertTriangle,
  Plus,
  Server,
  UserPlus,
  TrendingUp,
} from 'lucide-react';

// ─── Health aggregation ───────────────────────────────────────────────────────

function statusToAura(status?: string): AuraBand {
  if (!status) return 'dim';
  switch (status) {
    case 'healthy': return 'green';
    case 'degraded': return 'yellow';
    case 'unreachable': return 'red';
    case 'maintenance': return 'orange';
    default: return 'dim';
  }
}

// ─── Alert Item ───────────────────────────────────────────────────────────────

interface AlertItem {
  id: string;
  type: 'error' | 'warning' | 'info';
  title: string;
  description: string;
  time: string;
}

function AlertRow({ alert }: { alert: AlertItem }) {
  const colors = {
    error: 'var(--color-aura-red)',
    warning: 'var(--color-aura-yellow)',
    info: 'var(--color-aura-green)',
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-solar-border)' }}>
      <AlertTriangle size={16} style={{ color: colors[alert.type], flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-solar-text-primary)' }}>{alert.title}</p>
        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-solar-text-secondary)' }}>{alert.description}</p>
      </div>
      <span style={{ fontSize: '0.6875rem', color: 'var(--color-solar-text-secondary)', whiteSpace: 'nowrap' }}>{alert.time}</span>
    </div>
  );
}

// ─── Agent table columns ───────────────────────────────────────────────────────

const AGENT_COLUMNS: ColumnDef<Agent>[] = [
  {
    key: 'display_name',
    header: 'Agent',
    cell: (v) => (
      <span style={{ color: 'var(--color-solar-text-primary)', fontWeight: 500 }}>{String(v)}</span>
    ),
  },
  {
    key: 'tier',
    header: 'Tier',
    sortable: true,
    cell: (v) => <Badge variant="info">{String(v)}</Badge>,
  },
  {
    key: 'trust_tier',
    header: 'Trust',
    cell: (v) => {
      const variant = v === 'system' ? 'success' : v === 'trusted' ? 'info' : 'default';
      return <Badge variant={variant}>{String(v)}</Badge>;
    },
  },
  {
    key: 'status',
    header: 'Status',
    sortable: true,
    cell: (v) => {
      const s = v as Agent['status'];
      const variant = s === 'active' ? 'success' : s === 'canary' ? 'warning' : s === 'deprecated' ? 'default' : 'error';
      return <Badge variant={variant}>{s}</Badge>;
    },
  },
  {
    key: 'quality_score',
    header: 'Quality',
    sortable: true,
    cell: (v) => {
      const score = Number(v);
      const color = score >= 0.9 ? 'var(--color-aura-green)' : score >= 0.7 ? 'var(--color-aura-yellow)' : 'var(--color-aura-red)';
      return (
        <span style={{ color, fontFamily: 'var(--font-mono)', fontSize: '0.875rem' }}>
          {(score * 100).toFixed(1)}%
        </span>
      );
    },
  },
  {
    key: 'version',
    header: 'Version',
    cell: (v) => (
      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-solar-text-secondary)', fontSize: '0.75rem' }}>{String(v)}</span>
    ),
  },
];

// ─── Control Overview component ───────────────────────────────────────────────

export function ControlOverview() {
  const { data: agentsData, isLoading: agentsLoading, error: agentsError } = useQuery<PaginatedResponse<Agent>>({
    queryKey: ['control', 'agents'],
    queryFn: () => solar.sun.agents.list({ page: 1, page_size: 20 }),
    refetchInterval: 30_000,
  });

  const { data: modelsData } = useQuery<PaginatedResponse<Model>>({
    queryKey: ['control', 'models'],
    queryFn: () => solar.neptune.models.list({}),
    refetchInterval: 60_000,
  });

  const { data: tasksData } = useQuery<PaginatedResponse<Record<string, unknown>>>({
    queryKey: ['control', 'executions-today'],
    queryFn: () => solar.mars.executions.list({ page: 1, page_size: 1 }),
    refetchInterval: 15_000,
  });

  // Health checks per planet
  const { data: venusHealth } = useQuery<HealthResponse>({ queryKey: ['health', 'venus'], queryFn: () => solar.venus.health(), retry: 1, refetchInterval: 60_000 });
  const { data: neptuneHealth } = useQuery<HealthResponse>({ queryKey: ['health', 'neptune'], queryFn: () => solar.neptune.health(), retry: 1, refetchInterval: 60_000 });
  const { data: marsHealth } = useQuery<HealthResponse>({ queryKey: ['health', 'mars'], queryFn: () => solar.mars.health(), retry: 1, refetchInterval: 60_000 });
  const { data: moonHealth } = useQuery<HealthResponse>({ queryKey: ['health', 'moon'], queryFn: () => solar.moon.health(), retry: 1, refetchInterval: 60_000 });
  const { data: saturnHealth } = useQuery<HealthResponse>({ queryKey: ['health', 'saturn'], queryFn: () => solar.saturn.health(), retry: 1, refetchInterval: 60_000 });
  const { data: sunHealth } = useQuery<HealthResponse>({ queryKey: ['health', 'sun'], queryFn: () => solar.sun.health(), retry: 1, refetchInterval: 60_000 });
  const { data: plutoHealth } = useQuery<HealthResponse>({ queryKey: ['health', 'pluto'], queryFn: () => solar.pluto.health(), retry: 1, refetchInterval: 60_000 });
  const { data: themisHealth } = useQuery<HealthResponse>({ queryKey: ['health', 'themis'], queryFn: () => solar.themis.health(), retry: 1, refetchInterval: 60_000 });

  const healthData: Partial<Record<PlanetId, AuraBand>> = {
    venus: statusToAura(venusHealth?.status),
    neptune: statusToAura(neptuneHealth?.status),
    mars: statusToAura(marsHealth?.status),
    moon: statusToAura(moonHealth?.status),
    saturn: statusToAura(saturnHealth?.status),
    sun: statusToAura(sunHealth?.status),
    pluto: statusToAura(plutoHealth?.status),
    themis: statusToAura(themisHealth?.status),
  };

  const agents = agentsData?.items ?? [];
  const activeAgents = agents.filter((a) => a.status === 'active').length;
  const totalModels = modelsData?.total ?? 0;
  const executionsToday = tasksData?.total ?? 0;
  const avgQuality = agents.length > 0 ? agents.reduce((s, a) => s + a.quality_score, 0) / agents.length : 0;

  // Derived alerts from agent data
  const alerts: AlertItem[] = [];
  agents.filter(a => a.quality_score < 0.6).forEach(a => {
    alerts.push({ id: `low-q-${a.agent_id}`, type: 'warning', title: `Low quality: ${a.display_name}`, description: `Score at ${(a.quality_score * 100).toFixed(0)}% — review or retrain`, time: 'Now' });
  });
  agents.filter(a => a.status === 'deprecated').forEach(a => {
    alerts.push({ id: `dep-${a.agent_id}`, type: 'info', title: `Deprecated: ${a.display_name}`, description: 'Agent marked for retirement', time: 'Recent' });
  });
  if (themisHealth?.status === 'degraded' || themisHealth?.status === 'unreachable') {
    alerts.push({ id: 'themis-down', type: 'error', title: 'Themis service degraded', description: 'Judgment plane is not fully operational', time: 'Now' });
  }

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <PageHeader
        title="Platform Overview"
        description="Real-time health, metrics, and alerts for the Solar Systems AI control plane."
      />

      {agentsError && (
        <AlertBanner
          type="warning"
          title="Could not connect to Sun orchestrator"
          description="Agent data is unavailable. Check your Sun service configuration."
          dismissible
        />
      )}

      {/* ── Stats Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
        <StatsCard label="Active Agents" value={agentsLoading ? '—' : activeAgents} icon={<Bot size={20} />} planet="mars" />
        <StatsCard label="Registered Models" value={totalModels || '—'} icon={<Cpu size={20} />} planet="neptune" />
        <StatsCard label="Active Tenants" value="—" icon={<Users size={20} />} planet="saturn" />
        <StatsCard label="Executions Today" value={executionsToday || '—'} icon={<Activity size={20} />} planet="mars" />
        <StatsCard label="Avg Quality Score" value={avgQuality > 0 ? `${(avgQuality * 100).toFixed(1)}%` : '—'} icon={<TrendingUp size={20} />} planet="themis" />
      </div>

      {/* ── Platform Health Map ── */}
      <div style={{ background: 'var(--color-solar-card)', border: '1px solid var(--color-solar-border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-solar-text-primary)', margin: 0 }}>Platform Topology</p>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {(['green', 'yellow', 'orange', 'red', 'dim'] as const).map(band => (
              <div key={band} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <StatusDot status={band === 'green' ? 'healthy' : band === 'yellow' ? 'degraded' : band === 'red' ? 'unreachable' : band === 'orange' ? 'degraded' : 'maintenance'} />
                <span style={{ fontSize: '0.6875rem', color: 'var(--color-solar-text-secondary)', textTransform: 'capitalize' }}>{band}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <SolarSystemMap healthData={healthData} width={700} height={420} interactive />
        </div>
      </div>

      {/* ── Two-column: Alerts + Quick Actions ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1rem' }}>
        {/* Alerts */}
        <div style={{ background: 'var(--color-solar-card)', border: '1px solid var(--color-solar-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-solar-border)' }}>
            <p style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-solar-text-primary)' }}>
              <AlertTriangle size={14} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
              Recent Alerts ({alerts.length})
            </p>
          </div>
          {alerts.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-solar-text-secondary)', fontSize: '0.8125rem' }}>
              No active alerts — all systems nominal.
            </div>
          ) : (
            alerts.slice(0, 8).map(a => <AlertRow key={a.id} alert={a} />)
          )}
        </div>

        {/* Quick Actions */}
        <div style={{ background: 'var(--color-solar-card)', border: '1px solid var(--color-solar-border)', borderRadius: 'var(--radius-lg)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <p style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-solar-text-primary)' }}>Quick Actions</p>
          <Button variant="primary" size="sm" style={{ justifyContent: 'flex-start', gap: '0.5rem' }} onClick={() => window.location.href = '/agents'}>
            <Plus size={14} /> Register Agent
          </Button>
          <Button variant="secondary" size="sm" style={{ justifyContent: 'flex-start', gap: '0.5rem' }} onClick={() => window.location.href = '/models/providers'}>
            <Server size={14} /> Register Provider
          </Button>
          <Button variant="secondary" size="sm" style={{ justifyContent: 'flex-start', gap: '0.5rem' }} onClick={() => window.location.href = '/tenants'}>
            <UserPlus size={14} /> Create Tenant
          </Button>
          <Button variant="secondary" size="sm" style={{ justifyContent: 'flex-start', gap: '0.5rem' }} onClick={() => window.location.href = '/skills'}>
            <Star size={14} /> Register Skill
          </Button>
        </div>
      </div>

      {/* ── Agents table ── */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-solar-text-primary)', margin: 0 }}>Registered Agents</p>
          <Button variant="ghost" size="sm" onClick={() => window.location.href = '/agents'}>View All →</Button>
        </div>
        {agentsLoading ? (
          <Skeleton lines={6} height="40px" />
        ) : (
          <DataTable<Agent>
            columns={AGENT_COLUMNS}
            data={agents.slice(0, 10)}
            emptyMessage="No agents registered yet."
            pagination={agentsData ? { page: agentsData.page, pageSize: agentsData.page_size, total: agentsData.total } : undefined}
          />
        )}
      </div>
    </div>
  );
}
