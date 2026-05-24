'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  PageHeader,
  DataTable,
  Badge,
  Button,
  Input,
  Select,
  Drawer,
  PlanetBadge,
  JsonViewer,
  Skeleton,
  AlertBanner,
  type ColumnDef,
} from '@solar/ui';
import type { AuditRecord, PaginatedResponse, PlanetId } from '@solar/api';
import { useSolar } from '../useSolar';
import { Providers } from '../Providers';
import { Search, Filter, Link2, Shield } from 'lucide-react';

export function AuditPage() {
  return (
    <Providers>
      <AuditPageContent />
    </Providers>
  );
}

function AuditPageContent() {
  const [page, setPage] = useState(1);
  const [eventFilter, setEventFilter] = useState('');
  const [taskSearch, setTaskSearch] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<AuditRecord | null>(null);
  const solar = useSolar();

  const { data, isLoading, error } = useQuery<PaginatedResponse<AuditRecord>>({
    queryKey: ['audit', page, eventFilter, taskSearch],
    queryFn: () => solar.moon.audit.list({
      page,
      page_size: 25,
      task_id: taskSearch || undefined,
    }),
  });

  const records = data?.items ?? [];
  const filteredRecords = eventFilter
    ? records.filter((r) => r.event_type.includes(eventFilter))
    : records;

  const columns: ColumnDef<AuditRecord>[] = [
    {
      key: 'record_id',
      header: 'Record ID',
      width: '140px',
      cell: (v) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--color-solar-text-secondary)' }}>
          {String(v).substring(0, 16)}…
        </span>
      ),
    },
    {
      key: 'event_type',
      header: 'Event',
      cell: (v) => (
        <Badge variant="info">{String(v)}</Badge>
      ),
    },
    {
      key: 'task_id',
      header: 'Task',
      cell: (v) => {
        if (!v) return <span style={{ color: 'var(--color-solar-text-secondary)', fontSize: '0.75rem' }}>—</span>;
        return (
          <a
            href={`/tasks/detail?id=${v}`}
            style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--color-solar-accent)', textDecoration: 'none' }}
            onClick={(e) => e.stopPropagation()}
          >
            {String(v).substring(0, 12)}…
          </a>
        );
      },
    },
    {
      key: 'planet_source',
      header: 'Source',
      cell: (v) => <PlanetBadge planet={v as PlanetId} />,
    },
    {
      key: 'created_at',
      header: 'Timestamp',
      cell: (v) => (
        <span style={{ fontSize: '0.75rem', color: 'var(--color-solar-text-secondary)' }}>
          {new Date(String(v)).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'hash',
      header: 'Chain',
      width: '60px',
      cell: (_v, row) => {
        const r = row as AuditRecord;
        return (
          <div title={`Hash: ${r.hash}\nPrev: ${r.prev_hash}`} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Link2 size={12} style={{ color: 'var(--color-solar-success)' }} />
          </div>
        );
      },
    },
  ];

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <PageHeader
        title="Audit Trail"
        description="Immutable, hash-chained log of all platform events and task lifecycle operations."
      />

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '0 0 220px' }}>
          <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-solar-text-secondary)' }} />
          <Input
            placeholder="Search by task ID…"
            value={taskSearch}
            onChange={(e) => { setTaskSearch(e.target.value); setPage(1); }}
            style={{ paddingLeft: '2rem', fontSize: '0.8rem' }}
          />
        </div>
        <Select
          value={eventFilter}
          onChange={(e) => { setEventFilter(e.target.value); setPage(1); }}
          style={{ width: '180px', fontSize: '0.8rem' }}
        >
          <option value="">All Events</option>
          <option value="task.submitted">task.submitted</option>
          <option value="task.started">task.started</option>
          <option value="task.completed">task.completed</option>
          <option value="task.failed">task.failed</option>
          <option value="task.cancelled">task.cancelled</option>
          <option value="auth.login">auth.login</option>
          <option value="auth.refresh">auth.refresh</option>
          <option value="resource.registered">resource.registered</option>
          <option value="key.created">key.created</option>
          <option value="key.revoked">key.revoked</option>
        </Select>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', color: 'var(--color-solar-text-secondary)', marginLeft: 'auto' }}>
          <Shield size={12} />
          Hash-chain verified
        </div>
      </div>

      {error && <AlertBanner type="warning" title="Failed to load audit records" description="Check your connection." dismissible />}

      {isLoading ? (
        <Skeleton lines={12} height="40px" />
      ) : (
        <DataTable<AuditRecord>
          columns={columns}
          data={filteredRecords}
          emptyMessage="No audit records found matching your filters."
          onRowClick={(row) => setSelectedRecord(row)}
          pagination={data ? { page: data.page, pageSize: data.page_size, total: data.total } : undefined}
          onPageChange={setPage}
        />
      )}

      {/* Detail Drawer */}
      <Drawer
        open={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        title="Audit Record Detail"
      >
        {selectedRecord && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '0.5rem 0' }}>
            <DetailRow label="Record ID" value={selectedRecord.record_id} mono />
            <DetailRow label="Event Type" value={selectedRecord.event_type} />
            <DetailRow label="Planet Source" value={selectedRecord.planet_source} />
            <DetailRow label="Principal" value={selectedRecord.principal_id} mono />
            <DetailRow label="Tenant" value={selectedRecord.tenant_id} mono />
            {selectedRecord.task_id && <DetailRow label="Task ID" value={selectedRecord.task_id} mono link={`/tasks/detail?id=${selectedRecord.task_id}`} />}
            <DetailRow label="Timestamp" value={new Date(selectedRecord.created_at).toLocaleString()} />

            <div style={{ borderTop: '1px solid var(--color-solar-border)', paddingTop: '1rem' }}>
              <p style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-solar-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Hash Chain
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div>
                  <span style={{ fontSize: '0.65rem', color: 'var(--color-solar-text-secondary)', display: 'block' }}>Current Hash</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--color-solar-text-primary)', wordBreak: 'break-all' }}>{selectedRecord.hash}</span>
                </div>
                <div>
                  <span style={{ fontSize: '0.65rem', color: 'var(--color-solar-text-secondary)', display: 'block' }}>Previous Hash</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--color-solar-text-primary)', wordBreak: 'break-all' }}>{selectedRecord.prev_hash}</span>
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--color-solar-border)', paddingTop: '1rem' }}>
              <p style={{ margin: '0 0 0.75rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-solar-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Payload
              </p>
              <JsonViewer data={selectedRecord.payload} />
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}

function DetailRow({ label, value, mono, link }: { label: string; value: string; mono?: boolean; link?: string }) {
  return (
    <div>
      <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--color-solar-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.125rem' }}>
        {label}
      </span>
      {link ? (
        <a href={link} style={{ fontFamily: mono ? 'var(--font-mono)' : 'inherit', fontSize: '0.8rem', color: 'var(--color-solar-accent)', textDecoration: 'none' }}>
          {value}
        </a>
      ) : (
        <span style={{ fontFamily: mono ? 'var(--font-mono)' : 'inherit', fontSize: '0.8rem', color: 'var(--color-solar-text-primary)' }}>
          {value}
        </span>
      )}
    </div>
  );
}
