'use client';

import { useState } from 'react';
import {
  PageHeader,
  Tabs,
  DataTable,
  Badge,
  StatsCard,
  StatusDot,
  type ColumnDef,
} from '@solar/ui';
import {
  Radio,
  Database,
  Lock,
  Network,
  HardDrive,
  FolderTree,
  Server,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface StreamInfo {
  name: string;
  messages: number;
  consumers: number;
  retention: string;
  subjects: string;
}

interface DbSchemaInfo {
  planet: string;
  schema: string;
  tables: number;
  last_migration: string;
}

interface ConsulService {
  name: string;
  address: string;
  port: number;
  health: 'passing' | 'warning' | 'critical';
}

// ─── Static data (would be fetched from infra APIs) ───────────────────────────

const NATS_STREAMS: StreamInfo[] = [
  { name: 'SOLAR_TASKS', messages: 12_480, consumers: 3, retention: '7d', subjects: 'solar.tasks.>' },
  { name: 'SOLAR_EXECUTIONS', messages: 8_923, consumers: 4, retention: '30d', subjects: 'solar.executions.>' },
  { name: 'SOLAR_BUDGET', messages: 45_102, consumers: 2, retention: '90d', subjects: 'solar.budget.>' },
  { name: 'SOLAR_AUDIT', messages: 156_789, consumers: 2, retention: '365d', subjects: 'solar.audit.>' },
  { name: 'SOLAR_RAG', messages: 3_241, consumers: 1, retention: '7d', subjects: 'solar.rag.>' },
  { name: 'SOLAR_INFRA', messages: 891, consumers: 1, retention: '3d', subjects: 'solar.infra.>' },
];

const DB_SCHEMAS: DbSchemaInfo[] = [
  { planet: 'Venus', schema: 'venus', tables: 4, last_migration: '2026-05-20' },
  { planet: 'Mars', schema: 'mars', tables: 6, last_migration: '2026-05-18' },
  { planet: 'Moon', schema: 'moon', tables: 8, last_migration: '2026-05-21' },
  { planet: 'Saturn', schema: 'saturn', tables: 5, last_migration: '2026-05-19' },
  { planet: 'Sun', schema: 'sun', tables: 7, last_migration: '2026-05-20' },
  { planet: 'Pluto', schema: 'pluto', tables: 4, last_migration: '2026-05-15' },
  { planet: 'Themis', schema: 'themis', tables: 6, last_migration: '2026-05-22' },
];

const CONSUL_SERVICES: ConsulService[] = [
  { name: 'venus', address: '10.0.1.10', port: 8000, health: 'passing' },
  { name: 'neptune', address: '10.0.1.11', port: 8001, health: 'passing' },
  { name: 'mars', address: '10.0.1.12', port: 8002, health: 'passing' },
  { name: 'moon', address: '10.0.1.13', port: 8003, health: 'passing' },
  { name: 'saturn', address: '10.0.1.16', port: 8006, health: 'passing' },
  { name: 'sun', address: '10.0.1.17', port: 8007, health: 'passing' },
  { name: 'pluto', address: '10.0.1.18', port: 8008, health: 'warning' },
  { name: 'themis', address: '10.0.1.19', port: 8009, health: 'passing' },
];

// ─── Column definitions ───────────────────────────────────────────────────────

const STREAM_COLUMNS: ColumnDef<StreamInfo>[] = [
  { key: 'name', header: 'Stream', cell: (v) => <code style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--color-solar-text-primary)', fontWeight: 500 }}>{String(v)}</code> },
  { key: 'messages', header: 'Messages', sortable: true, cell: (v) => <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: 'var(--color-solar-text-primary)' }}>{Number(v).toLocaleString()}</span> },
  { key: 'consumers', header: 'Consumers', cell: (v) => <Badge variant="default">{String(v)}</Badge> },
  { key: 'retention', header: 'Retention', cell: (v) => <span style={{ fontSize: '0.8125rem', color: 'var(--color-solar-text-secondary)' }}>{String(v)}</span> },
  { key: 'subjects', header: 'Subjects', cell: (v) => <code style={{ fontSize: '0.6875rem', fontFamily: 'var(--font-mono)', color: 'var(--color-solar-text-muted)' }}>{String(v)}</code> },
];

const DB_COLUMNS: ColumnDef<DbSchemaInfo>[] = [
  { key: 'planet', header: 'Planet', cell: (v) => <span style={{ fontWeight: 500, color: 'var(--color-solar-text-primary)' }}>{String(v)}</span> },
  { key: 'schema', header: 'Schema', cell: (v) => <code style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--color-solar-text-secondary)' }}>{String(v)}</code> },
  { key: 'tables', header: 'Tables', cell: (v) => <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>{String(v)}</span> },
  { key: 'last_migration', header: 'Last Migration', cell: (v) => <code style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--color-solar-text-muted)' }}>{String(v)}</code> },
];

const CONSUL_COLUMNS: ColumnDef<ConsulService>[] = [
  { key: 'name', header: 'Service', cell: (v) => <code style={{ fontSize: '0.8125rem', fontFamily: 'var(--font-mono)', color: 'var(--color-solar-text-primary)', fontWeight: 500 }}>{String(v)}</code> },
  { key: 'address', header: 'Address', cell: (v) => <code style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--color-solar-text-secondary)' }}>{String(v)}</code> },
  { key: 'port', header: 'Port', cell: (v) => <code style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--color-solar-text-muted)' }}>{String(v)}</code> },
  {
    key: 'health',
    header: 'Health',
    cell: (v) => {
      const status = String(v);
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <StatusDot status={status === 'passing' ? 'green' : status === 'warning' ? 'yellow' : 'red'} />
          <span style={{ fontSize: '0.8125rem', color: status === 'passing' ? '#22C55E' : status === 'warning' ? '#EAB308' : '#EF4444' }}>
            {status}
          </span>
        </div>
      );
    },
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function InfrastructurePage() {
  const [activeTab, setActiveTab] = useState('mercury');

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <PageHeader
        title="Infrastructure"
        description="Monitor messaging, databases, secrets management, and service discovery infrastructure."
      />

      <Tabs
        value={activeTab}
        onChange={setActiveTab}
        items={[
          { value: 'mercury', label: 'Mercury (NATS)' },
          { value: 'database', label: 'Database' },
          { value: 'vault', label: 'Vault' },
          { value: 'consul', label: 'Consul' },
        ]}
      />

      {/* ═══ Mercury Tab ═══ */}
      {activeTab === 'mercury' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.75rem' }}>
            <StatsCard label="Streams" value={6} icon={<Radio size={18} />} planet="mercury" />
            <StatsCard label="Total Messages" value="227K" icon={<HardDrive size={18} />} planet="neptune" />
            <StatsCard label="Consumers" value={13} icon={<Network size={18} />} planet="mars" />
            <StatsCard label="NATS Status" value="Connected" icon={<Server size={18} />} planet="jupiter" />
          </div>

          {/* Stream table */}
          <div style={{ background: 'var(--color-solar-card)', border: '1px solid var(--color-solar-border)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
            <h4 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-solar-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
              JetStream Streams
            </h4>
            <DataTable<StreamInfo> columns={STREAM_COLUMNS} data={NATS_STREAMS} emptyMessage="No streams." />
          </div>

          {/* Redis & APISIX */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ background: 'var(--color-solar-card)', border: '1px solid var(--color-solar-border)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
              <h4 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-solar-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                Redis
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--color-solar-text-secondary)' }}>Connection</span>
                  <Badge variant="success">Connected</Badge>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--color-solar-text-secondary)' }}>Memory Usage</span>
                  <code style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--color-solar-text-primary)' }}>128MB / 512MB</code>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--color-solar-text-secondary)' }}>Keys</span>
                  <code style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--color-solar-text-primary)' }}>4,521</code>
                </div>
              </div>
            </div>

            <div style={{ background: 'var(--color-solar-card)', border: '1px solid var(--color-solar-border)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
              <h4 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-solar-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                APISIX Gateway
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--color-solar-text-secondary)' }}>Routes</span>
                  <code style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--color-solar-text-primary)' }}>24</code>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--color-solar-text-secondary)' }}>Active Connections</span>
                  <code style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--color-solar-text-primary)' }}>47</code>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--color-solar-text-secondary)' }}>Status</span>
                  <Badge variant="success">Healthy</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Database Tab ═══ */}
      {activeTab === 'database' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Pool stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.75rem' }}>
            <StatsCard label="Pool Min" value={2} icon={<Database size={18} />} planet="moon" />
            <StatsCard label="Pool Max" value={20} icon={<Database size={18} />} planet="saturn" />
            <StatsCard label="Active" value={8} icon={<Database size={18} />} planet="mars" />
            <StatsCard label="Idle" value={12} icon={<Database size={18} />} planet="pluto" />
          </div>

          {/* Schema table */}
          <div style={{ background: 'var(--color-solar-card)', border: '1px solid var(--color-solar-border)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
            <h4 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-solar-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
              Database Schemas
            </h4>
            <DataTable<DbSchemaInfo> columns={DB_COLUMNS} data={DB_SCHEMAS} emptyMessage="No schemas." />
          </div>

          {/* pgvector */}
          <div style={{ background: 'var(--color-solar-card)', border: '1px solid var(--color-solar-border)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
            <h4 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-solar-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
              Extensions
            </h4>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <StatusDot status="green" />
                <code style={{ fontSize: '0.8125rem', fontFamily: 'var(--font-mono)' }}>pgvector 0.7.0</code>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <StatusDot status="green" />
                <code style={{ fontSize: '0.8125rem', fontFamily: 'var(--font-mono)' }}>pg_trgm</code>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <StatusDot status="green" />
                <code style={{ fontSize: '0.8125rem', fontFamily: 'var(--font-mono)' }}>uuid-ossp</code>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Vault Tab ═══ */}
      {activeTab === 'vault' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Seal status */}
          <div style={{ background: 'var(--color-solar-card)', border: '1px solid var(--color-solar-border)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Lock size={20} style={{ color: '#22C55E' }} />
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-solar-text-primary)' }}>Vault Unsealed</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-solar-text-muted)' }}>Vault is operational and accepting requests</div>
                </div>
              </div>
              <Badge variant="success">UNSEALED</Badge>
            </div>
          </div>

          {/* Policies */}
          <div style={{ background: 'var(--color-solar-card)', border: '1px solid var(--color-solar-border)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
            <h4 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-solar-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
              Policies
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              {['solar-platform', 'solar-pluto', 'solar-mars', 'solar-admin', 'default'].map((policy) => (
                <div key={policy} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: 'var(--color-solar-surface)', borderRadius: 'var(--radius-sm)' }}>
                  <code style={{ fontSize: '0.8125rem', fontFamily: 'var(--font-mono)', color: 'var(--color-solar-text-primary)' }}>{policy}</code>
                  <Badge variant="default">read-only</Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Secret paths */}
          <div style={{ background: 'var(--color-solar-card)', border: '1px solid var(--color-solar-border)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
            <h4 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-solar-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
              Secret Paths
            </h4>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-solar-text-secondary)' }}>
              <div style={{ padding: '0.25rem 0' }}>
                <FolderTree size={12} style={{ display: 'inline', marginRight: '0.5rem', color: 'var(--color-solar-text-muted)' }} />
                secret/solar/
              </div>
              <div style={{ padding: '0.25rem 0 0.25rem 1.5rem' }}>├── platform/db-credentials</div>
              <div style={{ padding: '0.25rem 0 0.25rem 1.5rem' }}>├── platform/jwt-keys</div>
              <div style={{ padding: '0.25rem 0 0.25rem 1.5rem' }}>├── services/venus/api-key</div>
              <div style={{ padding: '0.25rem 0 0.25rem 1.5rem' }}>├── services/mars/nomad-token</div>
              <div style={{ padding: '0.25rem 0 0.25rem 1.5rem' }}>├── services/pluto/openfga-config</div>
              <div style={{ padding: '0.25rem 0 0.25rem 1.5rem' }}>├── services/saturn/admin-token</div>
              <div style={{ padding: '0.25rem 0 0.25rem 1.5rem' }}>└── ephemeral/</div>
            </div>
          </div>

          {/* Service tokens */}
          <div style={{ background: 'var(--color-solar-card)', border: '1px solid var(--color-solar-border)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
            <h4 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-solar-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
              Active Service Tokens
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              {['pluto-service', 'mars-service', 'platform-admin'].map((token) => (
                <div key={token} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: 'var(--color-solar-surface)', borderRadius: 'var(--radius-sm)' }}>
                  <code style={{ fontSize: '0.8125rem', fontFamily: 'var(--font-mono)', color: 'var(--color-solar-text-primary)' }}>{token}</code>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--color-solar-text-muted)', fontFamily: 'var(--font-mono)' }}>renewable</span>
                    <Badge variant="success">active</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ Consul Tab ═══ */}
      {activeTab === 'consul' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.75rem' }}>
            <StatsCard label="Registered" value={8} icon={<Network size={18} />} planet="mercury" />
            <StatsCard label="Healthy" value={7} icon={<Server size={18} />} planet="jupiter" />
            <StatsCard label="Warning" value={1} icon={<Server size={18} />} planet="saturn" />
            <StatsCard label="KV Keys" value={42} icon={<FolderTree size={18} />} planet="moon" />
          </div>

          {/* Services table */}
          <div style={{ background: 'var(--color-solar-card)', border: '1px solid var(--color-solar-border)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
            <h4 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-solar-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
              Registered Services
            </h4>
            <DataTable<ConsulService> columns={CONSUL_COLUMNS} data={CONSUL_SERVICES} emptyMessage="No services registered." />
          </div>

          {/* KV browser */}
          <div style={{ background: 'var(--color-solar-card)', border: '1px solid var(--color-solar-border)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
            <h4 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-solar-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
              KV Store (read-only)
            </h4>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-solar-text-secondary)' }}>
              <div style={{ padding: '0.25rem 0' }}>
                <FolderTree size={12} style={{ display: 'inline', marginRight: '0.5rem', color: 'var(--color-solar-text-muted)' }} />
                solar/
              </div>
              <div style={{ padding: '0.25rem 0 0.25rem 1.5rem' }}>├── config/platform</div>
              <div style={{ padding: '0.25rem 0 0.25rem 1.5rem' }}>├── config/services/venus</div>
              <div style={{ padding: '0.25rem 0 0.25rem 1.5rem' }}>├── config/services/mars</div>
              <div style={{ padding: '0.25rem 0 0.25rem 1.5rem' }}>├── config/services/moon</div>
              <div style={{ padding: '0.25rem 0 0.25rem 1.5rem' }}>├── leader/sun</div>
              <div style={{ padding: '0.25rem 0 0.25rem 1.5rem' }}>└── locks/</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
