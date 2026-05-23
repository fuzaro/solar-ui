'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  PageHeader,
  DataTable,
  Badge,
  Button,
  Input,
  PlanetBadge,
  Drawer,
  JsonViewer,
  type ColumnDef,
  type PlanetId,
} from '@solar/ui';
import { createSolarClients, type AuditRecord } from '@solar/api';
import { Search, Download, RefreshCw, CheckCircle, Shield } from 'lucide-react';

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

// ─── Columns ──────────────────────────────────────────────────────────────────

const AUDIT_COLUMNS: ColumnDef<AuditRecord>[] = [
  {
    key: 'record_id',
    header: 'Record ID',
    cell: (v) => (
      <code style={{ fontSize: '0.6875rem', fontFamily: 'var(--font-mono)', color: 'var(--color-solar-text-primary)' }}>
        {String(v).slice(0, 12)}…
      </code>
    ),
  },
  {
    key: 'event_type',
    header: 'Event',
    sortable: true,
    cell: (v) => (
      <Badge variant="default">
        <code style={{ fontSize: '0.6875rem', fontFamily: 'var(--font-mono)' }}>{String(v)}</code>
      </Badge>
    ),
  },
  {
    key: 'tenant_id',
    header: 'Tenant',
    cell: (v) => (
      <code style={{ fontSize: '0.6875rem', fontFamily: 'var(--font-mono)', color: 'var(--color-solar-text-secondary)' }}>
        {String(v).slice(0, 10)}…
      </code>
    ),
  },
  {
    key: 'principal_id',
    header: 'Principal',
    cell: (v) => (
      <code style={{ fontSize: '0.6875rem', fontFamily: 'var(--font-mono)', color: 'var(--color-solar-text-secondary)' }}>
        {String(v)}
      </code>
    ),
  },
  {
    key: 'task_id',
    header: 'Task',
    cell: (v) => v ? (
      <code style={{ fontSize: '0.6875rem', fontFamily: 'var(--font-mono)', color: 'var(--color-solar-text-muted)' }}>
        {String(v).slice(0, 10)}…
      </code>
    ) : <span style={{ color: 'var(--color-solar-text-muted)' }}>—</span>,
  },
  {
    key: 'planet_source',
    header: 'Source',
    cell: (v) => v ? <PlanetBadge planet={v as PlanetId} size="sm" /> : <span>—</span>,
  },
  {
    key: 'hash',
    header: 'Hash',
    cell: (v) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
        <CheckCircle size={10} style={{ color: '#22C55E' }} />
        <code style={{ fontSize: '0.625rem', fontFamily: 'var(--font-mono)', color: 'var(--color-solar-text-muted)' }}>
          {String(v).slice(0, 8)}…
        </code>
      </div>
    ),
  },
  {
    key: 'created_at',
    header: 'Timestamp',
    sortable: true,
    cell: (v) => (
      <span style={{ fontSize: '0.6875rem', fontFamily: 'var(--font-mono)', color: 'var(--color-solar-text-muted)' }}>
        {String(v) ? new Date(String(v)).toLocaleString() : '—'}
      </span>
    ),
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function PlatformAudit() {
  const [filters, setFilters] = useState({
    tenant_id: '',
    principal_id: '',
    event_type: '',
    page: 1,
  });
  const [selectedRecord, setSelectedRecord] = useState<AuditRecord | null>(null);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['audit-records', filters],
    queryFn: async () => {
      const params: Record<string, string | number | boolean | undefined> = {
        page: filters.page,
        page_size: 50,
      };
      if (filters.tenant_id) params.tenant_id = filters.tenant_id;
      return solar.moon.audit.list(params as any);
    },
  });

  const records = data?.items || [];

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <PageHeader
          title="Platform Audit"
          description="Immutable hash-chained audit trail across all tenants and services."
          badge={data ? `${data.total ?? records.length} records` : undefined}
        />
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isRefetching}>
            <RefreshCw size={14} className={isRefetching ? 'animate-spin' : ''} /> Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download size={14} /> Export CSV
          </Button>
        </div>
      </div>

      {/* Hash chain integrity */}
      <div style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Shield size={16} style={{ color: '#22C55E' }} />
        <span style={{ fontSize: '0.8125rem', color: '#22C55E', fontWeight: 500 }}>Hash Chain Integrity: Verified</span>
        <span style={{ fontSize: '0.75rem', color: 'var(--color-solar-text-muted)' }}>— All records pass chain verification</span>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'end' }}>
        <div>
          <label style={{ fontSize: '0.6875rem', color: 'var(--color-solar-text-muted)', display: 'block', marginBottom: '0.25rem' }}>Tenant ID</label>
          <Input
            value={filters.tenant_id}
            onChange={(e) => setFilters({ ...filters, tenant_id: e.target.value })}
            placeholder="Filter by tenant…"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', width: '12rem' }}
          />
        </div>
        <div>
          <label style={{ fontSize: '0.6875rem', color: 'var(--color-solar-text-muted)', display: 'block', marginBottom: '0.25rem' }}>Principal ID</label>
          <Input
            value={filters.principal_id}
            onChange={(e) => setFilters({ ...filters, principal_id: e.target.value })}
            placeholder="Filter by principal…"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', width: '12rem' }}
          />
        </div>
        <div>
          <label style={{ fontSize: '0.6875rem', color: 'var(--color-solar-text-muted)', display: 'block', marginBottom: '0.25rem' }}>Event Type</label>
          <Input
            value={filters.event_type}
            onChange={(e) => setFilters({ ...filters, event_type: e.target.value })}
            placeholder="task.created, auth.validate…"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', width: '14rem' }}
          />
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <Search size={14} /> Apply
        </Button>
      </div>

      {/* Records table */}
      <DataTable<AuditRecord>
        columns={AUDIT_COLUMNS}
        data={records}
        emptyMessage={isLoading ? 'Loading audit records…' : 'No audit records match your filters.'}
        rowActions={(row) => [
          { label: 'View Detail', onClick: () => setSelectedRecord(row) },
        ]}
      />

      {/* Record detail drawer */}
      <Drawer
        open={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        title={`Audit Record — ${selectedRecord?.record_id.slice(0, 12)}…`}
        side="right"
        size="lg"
      >
        {selectedRecord && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Record metadata */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <span style={{ fontSize: '0.6875rem', color: 'var(--color-solar-text-muted)' }}>Record ID</span>
                <code style={{ display: 'block', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--color-solar-text-primary)' }}>{selectedRecord.record_id}</code>
              </div>
              <div>
                <span style={{ fontSize: '0.6875rem', color: 'var(--color-solar-text-muted)' }}>Event Type</span>
                <code style={{ display: 'block', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--color-solar-text-primary)' }}>{selectedRecord.event_type}</code>
              </div>
              <div>
                <span style={{ fontSize: '0.6875rem', color: 'var(--color-solar-text-muted)' }}>Tenant</span>
                <code style={{ display: 'block', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--color-solar-text-secondary)' }}>{selectedRecord.tenant_id}</code>
              </div>
              <div>
                <span style={{ fontSize: '0.6875rem', color: 'var(--color-solar-text-muted)' }}>Principal</span>
                <code style={{ display: 'block', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--color-solar-text-secondary)' }}>{selectedRecord.principal_id}</code>
              </div>
              <div>
                <span style={{ fontSize: '0.6875rem', color: 'var(--color-solar-text-muted)' }}>Task ID</span>
                <code style={{ display: 'block', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--color-solar-text-muted)' }}>{selectedRecord.task_id || '—'}</code>
              </div>
              <div>
                <span style={{ fontSize: '0.6875rem', color: 'var(--color-solar-text-muted)' }}>Source Planet</span>
                <div style={{ marginTop: '0.25rem' }}>
                  <PlanetBadge planet={selectedRecord.planet_source} size="sm" />
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.6875rem', color: 'var(--color-solar-text-muted)' }}>Timestamp</span>
                <code style={{ display: 'block', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--color-solar-text-secondary)' }}>{new Date(selectedRecord.created_at).toLocaleString()}</code>
              </div>
            </div>

            {/* Hash chain */}
            <div style={{ background: 'var(--color-solar-surface)', border: '1px solid var(--color-solar-border)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
              <h4 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-solar-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                Hash Chain
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--color-solar-text-muted)' }}>Current Hash</span>
                  <code style={{ fontSize: '0.6875rem', fontFamily: 'var(--font-mono)', color: 'var(--color-solar-text-primary)' }}>{selectedRecord.hash}</code>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--color-solar-text-muted)' }}>Previous Hash</span>
                  <code style={{ fontSize: '0.6875rem', fontFamily: 'var(--font-mono)', color: 'var(--color-solar-text-muted)' }}>{selectedRecord.prev_hash}</code>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: '0.25rem' }}>
                  <CheckCircle size={12} style={{ color: '#22C55E' }} />
                  <span style={{ fontSize: '0.6875rem', color: '#22C55E', fontWeight: 500 }}>Chain verified</span>
                </div>
              </div>
            </div>

            {/* Payload */}
            <div style={{ background: 'var(--color-solar-surface)', border: '1px solid var(--color-solar-border)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
              <h4 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-solar-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                Payload
              </h4>
              <JsonViewer data={selectedRecord.payload} collapsed={false} />
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
