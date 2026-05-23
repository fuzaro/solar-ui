'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  PageHeader,
  StatsCard,
  DataTable,
  PlanetBadge,
  StatusDot,
  SolarSystemMap,
  AuraBandDisplay,
  AlertBanner,
  Tabs,
  Drawer,
  JsonViewer,
  Button,
  PLANETS,
  PLANET_META,
  AURA_META,
  type ColumnDef,
  type PlanetId,
  type AuraBand,
} from '@solar/ui';
import { createSolarClients, type HealthResponse } from '@solar/api';
import {
  Server,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  RotateCcw,
  Wrench,
  FileText,
  Clock,
  Wifi,
  Activity,
} from 'lucide-react';

// ─── Solar clients ────────────────────────────────────────────────────────────

const solar = createSolarClients({
  venus: import.meta.env.PUBLIC_VENUS_URL || 'http://localhost:8000',
  neptune: import.meta.env.PUBLIC_NEPTUNE_URL || 'http://localhost:8001',
  mars: import.meta.env.PUBLIC_MARS_URL || 'http://localhost:8002',
  moon: import.meta.env.PUBLIC_MOON_URL || 'http://localhost:8003',
  saturn: import.meta.env.PUBLIC_SATURN_URL || 'http://localhost:8006',
  sun: import.meta.env.PUBLIC_SUN_URL || 'http://localhost:8007',
  pluto: import.meta.env.PUBLIC_PLUTO_URL || 'http://localhost:8008',
  themis: import.meta.env.PUBLIC_THEMIS_URL || 'http://localhost:8009',
});

// ─── Types ────────────────────────────────────────────────────────────────────

interface ServiceRow {
  id: PlanetId;
  name: string;
  port: number;
  description: string;
  health: AuraBand;
  version: string;
  uptime: string;
  dependencies: string;
  lastCheck: string;
}

type HealthMap = Partial<Record<PlanetId, HealthResponse>>;

const SERVICE_PLANETS: PlanetId[] = ['venus', 'neptune', 'mars', 'moon', 'saturn', 'sun', 'pluto', 'themis'];

// ─── Health fetching ──────────────────────────────────────────────────────────

const healthClients: Record<string, () => Promise<HealthResponse>> = {
  venus: solar.venus.health,
  neptune: solar.neptune.health,
  mars: solar.mars.health,
  moon: solar.moon.health,
  saturn: solar.saturn.health,
  sun: solar.sun.health,
  pluto: solar.pluto.health,
  themis: solar.themis.health,
};

async function fetchAllHealth(): Promise<HealthMap> {
  const entries = await Promise.allSettled(
    SERVICE_PLANETS.map(async (p) => {
      const resp = await healthClients[p]();
      return [p, resp] as [PlanetId, HealthResponse];
    })
  );
  const map: HealthMap = {};
  entries.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      const [planet, health] = result.value;
      map[planet] = health;
    }
  });
  return map;
}

function statusToBand(status?: string): AuraBand {
  switch (status) {
    case 'healthy': return 'green';
    case 'degraded': return 'yellow';
    case 'unreachable': return 'red';
    case 'maintenance': return 'orange';
    default: return 'dim';
  }
}

function formatUptime(seconds?: number): string {
  if (!seconds) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
  return `${h}h ${m}m`;
}

// ─── Table columns ────────────────────────────────────────────────────────────

const SERVICE_COLUMNS: ColumnDef<ServiceRow>[] = [
  {
    key: 'name',
    header: 'Service',
    cell: (_, row) => row ? <PlanetBadge planet={row.id} size="md" showPort /> : null,
  },
  {
    key: 'health',
    header: 'Status',
    sortable: true,
    cell: (v) => {
      const band = v as AuraBand;
      const meta = AURA_META[band];
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <StatusDot status={band} pulse={band === 'green'} />
          <span style={{ color: meta.color, fontSize: '0.8125rem', fontWeight: 500, fontFamily: 'var(--font-mono)' }}>
            {meta.label}
          </span>
        </div>
      );
    },
  },
  {
    key: 'version',
    header: 'Version',
    cell: (v) => (
      <code style={{ fontSize: '0.75rem', color: 'var(--color-solar-text-secondary)', fontFamily: 'var(--font-mono)' }}>
        {String(v) || '—'}
      </code>
    ),
  },
  {
    key: 'port',
    header: 'Port',
    cell: (v) => (
      <code style={{ fontSize: '0.75rem', color: 'var(--color-solar-text-muted)', fontFamily: 'var(--font-mono)' }}>
        :{String(v)}
      </code>
    ),
  },
  {
    key: 'uptime',
    header: 'Uptime',
    cell: (v) => (
      <span style={{ fontSize: '0.8125rem', color: 'var(--color-solar-text-secondary)' }}>
        {String(v)}
      </span>
    ),
  },
  {
    key: 'dependencies',
    header: 'Dependencies',
    cell: (v) => (
      <span style={{ fontSize: '0.75rem', color: 'var(--color-solar-text-muted)' }}>
        {String(v) || '—'}
      </span>
    ),
  },
  {
    key: 'lastCheck',
    header: 'Last Check',
    cell: (v) => (
      <span style={{ fontSize: '0.75rem', color: 'var(--color-solar-text-muted)', fontFamily: 'var(--font-mono)' }}>
        {String(v)}
      </span>
    ),
  },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export function EngineeringTopology() {
  const [selectedPlanet, setSelectedPlanet] = useState<PlanetId | null>(null);
  const [activeTab, setActiveTab] = useState('map');

  const { data: healthMap = {}, dataUpdatedAt, refetch, isRefetching } = useQuery({
    queryKey: ['platform-health'],
    queryFn: fetchAllHealth,
    refetchInterval: 10_000,
    staleTime: 8_000,
  });

  const healthBands: Partial<Record<PlanetId, AuraBand>> = {};
  SERVICE_PLANETS.forEach((p) => {
    healthBands[p] = statusToBand(healthMap[p]?.status);
  });

  const serviceRows: ServiceRow[] = SERVICE_PLANETS.map((p) => {
    const h = healthMap[p];
    const deps = h?.dependencies ? Object.keys(h.dependencies).join(', ') : '—';
    return {
      id: p,
      name: PLANET_META[p].label,
      port: PLANET_META[p].port,
      description: PLANET_META[p].description,
      health: healthBands[p] ?? 'dim',
      version: h?.version ?? '—',
      uptime: formatUptime(h?.uptime_s),
      dependencies: deps,
      lastCheck: dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : '—',
    };
  });

  const healthyCount = serviceRows.filter((r) => r.health === 'green').length;
  const warningCount = serviceRows.filter((r) => r.health === 'yellow' || r.health === 'orange').length;
  const criticalCount = serviceRows.filter((r) => r.health === 'red').length;
  const unknownCount = serviceRows.filter((r) => r.health === 'dim').length;

  const selectedHealth = selectedPlanet ? healthMap[selectedPlanet] : undefined;

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <PageHeader
          title="Platform Topology"
          description="Live health monitoring of all Solar Systems AI microservices."
          badge={`${healthyCount}/${serviceRows.length} healthy`}
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => refetch()}
          disabled={isRefetching}
        >
          <RefreshCw size={14} className={isRefetching ? 'animate-spin' : ''} />
          Refresh
        </Button>
      </div>

      {criticalCount > 0 && (
        <AlertBanner
          type="error"
          title={`${criticalCount} service(s) critical`}
          description="Immediate attention required. Services reporting critical health status."
          dismissible
        />
      )}
      {warningCount > 0 && criticalCount === 0 && (
        <AlertBanner
          type="warning"
          title={`${warningCount} service(s) degraded`}
          description="Some services reporting warnings. Monitor closely."
          dismissible
        />
      )}

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.75rem' }}>
        <StatsCard label="Healthy" value={healthyCount} icon={<CheckCircle size={18} />} planet="jupiter" />
        <StatsCard label="Warning" value={warningCount} icon={<AlertTriangle size={18} />} planet="saturn" />
        <StatsCard label="Critical" value={criticalCount} icon={<AlertTriangle size={18} />} planet="venus" />
        <StatsCard label="No Data" value={unknownCount} icon={<Server size={18} />} planet="pluto" />
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={setActiveTab}
        items={[
          { value: 'map', label: 'System Map' },
          { value: 'table', label: 'Service Table' },
          { value: 'aura', label: 'AURA Overview' },
        ]}
      />

      {/* Map Tab */}
      {activeTab === 'map' && (
        <div
          style={{
            background: 'var(--color-solar-card)',
            border: '1px solid var(--color-solar-border)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem',
            display: 'flex',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          <SolarSystemMap
            healthData={healthBands}
            onPlanetClick={(planet) => setSelectedPlanet(planet)}
            width={760}
            height={460}
            interactive
          />
        </div>
      )}

      {/* Table Tab */}
      {activeTab === 'table' && (
        <DataTable<ServiceRow>
          columns={SERVICE_COLUMNS}
          data={serviceRows}
          emptyMessage="No services found."
        />
      )}

      {/* AURA Tab */}
      {activeTab === 'aura' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
          {serviceRows.map((svc) => (
            <div
              key={svc.id}
              style={{
                background: 'var(--color-solar-card)',
                border: '1px solid var(--color-solar-border)',
                borderRadius: 'var(--radius-lg)',
                padding: '1rem',
                cursor: 'pointer',
              }}
              onClick={() => setSelectedPlanet(svc.id)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <PlanetBadge planet={svc.id} size="md" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--color-solar-text-secondary)' }}>
                    v{svc.version}
                  </div>
                </div>
                <StatusDot status={svc.health} pulse={svc.health === 'green'} label={AURA_META[svc.health].label} />
              </div>
              <AuraBandDisplay
                title="Service AURA"
                bands={{ [svc.health]: 1.0 } as Partial<Record<AuraBand, number>>}
                axes={['latency', 'error_rate', 'throughput', 'saturation']}
              />
            </div>
          ))}
        </div>
      )}

      {/* Planet Detail Drawer */}
      <Drawer
        open={!!selectedPlanet}
        onClose={() => setSelectedPlanet(null)}
        title={selectedPlanet ? `${PLANET_META[selectedPlanet].label} — Detail` : ''}
        side="right"
        size="lg"
      >
        {selectedPlanet && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Service header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <PlanetBadge planet={selectedPlanet} size="lg" showPort />
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-solar-text-muted)', fontFamily: 'var(--font-mono)' }}>
                  v{selectedHealth?.version ?? '—'} • port {PLANET_META[selectedPlanet].port}
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-solar-text-secondary)', marginTop: '0.25rem' }}>
                  {PLANET_META[selectedPlanet].description}
                </div>
              </div>
            </div>

            {/* Health status */}
            <div style={{ background: 'var(--color-solar-surface)', border: '1px solid var(--color-solar-border)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <StatusDot status={healthBands[selectedPlanet] ?? 'dim'} pulse={healthBands[selectedPlanet] === 'green'} />
                <span style={{ fontWeight: 600, color: AURA_META[healthBands[selectedPlanet] ?? 'dim'].color }}>
                  {AURA_META[healthBands[selectedPlanet] ?? 'dim'].label}
                </span>
              </div>

              {/* Key metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ textAlign: 'center', padding: '0.5rem', background: 'var(--color-solar-card)', borderRadius: 'var(--radius-sm)' }}>
                  <Clock size={14} style={{ margin: '0 auto 0.25rem', color: 'var(--color-solar-text-muted)' }} />
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-solar-text-primary)', fontFamily: 'var(--font-mono)' }}>
                    {formatUptime(selectedHealth?.uptime_s)}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--color-solar-text-muted)' }}>Uptime</div>
                </div>
                <div style={{ textAlign: 'center', padding: '0.5rem', background: 'var(--color-solar-card)', borderRadius: 'var(--radius-sm)' }}>
                  <Wifi size={14} style={{ margin: '0 auto 0.25rem', color: 'var(--color-solar-text-muted)' }} />
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-solar-text-primary)', fontFamily: 'var(--font-mono)' }}>
                    {selectedHealth?.dependencies ? Object.keys(selectedHealth.dependencies).length : 0}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--color-solar-text-muted)' }}>Connections</div>
                </div>
                <div style={{ textAlign: 'center', padding: '0.5rem', background: 'var(--color-solar-card)', borderRadius: 'var(--radius-sm)' }}>
                  <Activity size={14} style={{ margin: '0 auto 0.25rem', color: 'var(--color-solar-text-muted)' }} />
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-solar-text-primary)', fontFamily: 'var(--font-mono)' }}>
                    —
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--color-solar-text-muted)' }}>Req/s</div>
                </div>
              </div>
            </div>

            {/* Dependencies */}
            {selectedHealth?.dependencies && Object.keys(selectedHealth.dependencies).length > 0 && (
              <div style={{ background: 'var(--color-solar-surface)', border: '1px solid var(--color-solar-border)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                <h4 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-solar-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                  Dependencies
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  {Object.entries(selectedHealth.dependencies).map(([dep, status]) => (
                    <div key={dep} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.375rem 0.5rem', background: 'var(--color-solar-card)', borderRadius: 'var(--radius-sm)' }}>
                      <span style={{ fontSize: '0.8125rem', fontFamily: 'var(--font-mono)', color: 'var(--color-solar-text-secondary)' }}>{dep}</span>
                      <StatusDot status={statusToBand(status)} label={status} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick actions */}
            <div style={{ background: 'var(--color-solar-surface)', border: '1px solid var(--color-solar-border)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
              <h4 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-solar-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                Quick Actions
              </h4>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <Button variant="outline" size="sm"><RotateCcw size={12} /> Restart</Button>
                <Button variant="outline" size="sm"><Wrench size={12} /> Maintenance</Button>
                <Button variant="outline" size="sm"><FileText size={12} /> View Logs</Button>
              </div>
            </div>

            {/* Raw health JSON */}
            {selectedHealth && (
              <div style={{ background: 'var(--color-solar-surface)', border: '1px solid var(--color-solar-border)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                <h4 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-solar-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                  Health Response
                </h4>
                <JsonViewer data={selectedHealth} collapsed={false} />
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
