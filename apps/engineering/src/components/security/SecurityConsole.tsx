'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  PageHeader,
  DataTable,
  Badge,
  Button,
  Input,
  Select,
  Tabs,
  Modal,
  FormField,
  ConfirmDialog,
  JsonViewer,
  AlertBanner,
  useToast,
  type ColumnDef,
} from '@solar/ui';
import { createSolarClients, getSolarConfig, type Token } from '@solar/api';
import { getSession } from '@solar/auth';
import { Providers } from '../Providers';
import { Key, Lock, Plus, Search, CheckCircle, XCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

// ─── Solar clients ────────────────────────────────────────────────────────────

const solar = createSolarClients({
  ...getSolarConfig(),
  getToken: () => getSession()?.token ?? null,
});

// ─── Token columns ────────────────────────────────────────────────────────────

const TOKEN_COLUMNS: ColumnDef<Token>[] = [
  {
    key: 'token_id',
    header: 'Token ID',
    cell: (v) => <code style={{ fontSize: '0.6875rem', fontFamily: 'var(--font-mono)', color: 'var(--color-solar-text-primary)' }}>{String(v).slice(0, 16)}…</code>,
  },
  {
    key: 'principal_id',
    header: 'Principal',
    cell: (v) => <code style={{ fontSize: '0.6875rem', fontFamily: 'var(--font-mono)', color: 'var(--color-solar-text-secondary)' }}>{String(v)}</code>,
  },
  {
    key: 'task_id',
    header: 'Task',
    cell: (v) => <code style={{ fontSize: '0.6875rem', fontFamily: 'var(--font-mono)', color: 'var(--color-solar-text-muted)' }}>{String(v).slice(0, 12)}…</code>,
  },
  {
    key: 'scopes',
    header: 'Scopes',
    cell: (v) => (
      <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
        {(v as string[] || []).map((s) => <Badge key={s} variant="default">{s}</Badge>)}
      </div>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    sortable: true,
    cell: (v) => <Badge variant={v === 'active' ? 'success' : 'error'}>{String(v)}</Badge>,
  },
  {
    key: 'expires_at',
    header: 'Expires',
    cell: (v) => <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--color-solar-text-muted)' }}>{String(v) ? new Date(String(v)).toLocaleString() : '—'}</span>,
  },
  {
    key: 'issued_at',
    header: 'Issued',
    cell: (v) => <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--color-solar-text-muted)' }}>{String(v) ? new Date(String(v)).toLocaleString() : '—'}</span>,
  },
];

// ─── Access Control types ─────────────────────────────────────────────────────

interface Tuple {
  user: string;
  relation: string;
  object: string;
  created_at: string;
}

const TUPLE_COLUMNS: ColumnDef<Tuple>[] = [
  { key: 'user', header: 'User', cell: (v) => <code style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>{String(v)}</code> },
  { key: 'relation', header: 'Relation', cell: (v) => <Badge variant="info">{String(v)}</Badge> },
  { key: 'object', header: 'Object', cell: (v) => <code style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>{String(v)}</code> },
  { key: 'created_at', header: 'Created', cell: (v) => <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--color-solar-text-muted)' }}>{String(v) ? new Date(String(v)).toLocaleDateString() : '—'}</span> },
];

// ─── Anomaly types ────────────────────────────────────────────────────────────

interface AnomalyEvent {
  event_type: string;
  principal_id: string;
  details: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: string;
}

const ANOMALY_COLUMNS: ColumnDef<AnomalyEvent>[] = [
  { key: 'event_type', header: 'Event', cell: (v) => <code style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--color-solar-text-primary)' }}>{String(v)}</code> },
  { key: 'principal_id', header: 'Principal', cell: (v) => <code style={{ fontSize: '0.6875rem', fontFamily: 'var(--font-mono)', color: 'var(--color-solar-text-secondary)' }}>{String(v)}</code> },
  { key: 'details', header: 'Details', cell: (v) => <span style={{ fontSize: '0.8125rem', color: 'var(--color-solar-text-secondary)' }}>{String(v)}</span> },
  {
    key: 'severity',
    header: 'Severity',
    sortable: true,
    cell: (v) => <Badge variant={v === 'critical' ? 'error' : v === 'warning' ? 'warning' : 'info'}>{String(v)}</Badge>,
  },
  { key: 'timestamp', header: 'Time', cell: (v) => <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--color-solar-text-muted)' }}>{String(v) ? new Date(String(v)).toLocaleString() : '—'}</span> },
];

// ─── Mint Token Form ──────────────────────────────────────────────────────────

const mintSchema = z.object({
  principal_id: z.string().min(1, 'Principal ID required'),
  task_id: z.string().min(1, 'Task ID required'),
  scopes: z.string().min(1, 'At least one scope required'),
  ttl_seconds: z.coerce.number().min(60).max(86400),
});

// ─── Check Access Form ────────────────────────────────────────────────────────

const checkAccessSchema = z.object({
  principal_id: z.string().min(1),
  resource_id: z.string().min(1),
  action: z.string().min(1),
});

// ─── Component ────────────────────────────────────────────────────────────────

export function SecurityConsole() {
  return (
    <Providers>
      <SecurityConsoleContent />
    </Providers>
  );
}

function SecurityConsoleContent() {
  const [activeTab, setActiveTab] = useState('tokens');
  // showMintModal / revokeTokenId removidos com tokens UI (CR22).
  const [accessResult, setAccessResult] = useState<{ allowed: boolean; reason?: string } | null>(null);
  const toast = useToast();
  const queryClient = useQueryClient();

  // CR22 (v0.1.2) — tokens list/get inventados removidos; revoke
  // mantido em pluto.ts mas UI agora é stub (sem lista pra invocar
  // revoke). Token mgmt volta quando R3 implementar GET /v1/tokens/{id}
  // (CR24 aberto).

  // ─── Check access form ────────────────────────────────────────────────────
  const accessForm = useForm({ resolver: zodResolver(checkAccessSchema), defaultValues: { principal_id: '', resource_id: '', action: 'read' } });

  const checkAccessMutation = useMutation({
    mutationFn: (data: z.infer<typeof checkAccessSchema>) => solar.pluto.access.check(data),
    onSuccess: (result) => setAccessResult(result),
  });

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <PageHeader
        title="Security Console"
        description="Manage tokens, access control, certificates, and security anomalies via Pluto."
      />

      <Tabs
        value={activeTab}
        onChange={setActiveTab}
        items={[
          { value: 'tokens', label: 'Tokens' },
          { value: 'certificates', label: 'Certificates' },
          { value: 'access', label: 'Access Control' },
          { value: 'anomalies', label: 'Anomalies' },
        ]}
      />

      {/* ═══ Tokens Tab — stub (CR22, v0.1.2) ═══ */}
      {activeTab === 'tokens' && (
        <AlertBanner
          type="warning"
          title="Token Management — Em construção"
          description="Token list/lookup aguarda implementação em Pluto (CR22 + CR24). Spec pluto-security.md §7.1 prevê GET /v1/tokens/{id} e POST /v1/tokens/refresh — ambos ainda sem código em routes_tokens.py. POST /v1/tokens/{id}/revoke já está implementado mas precisa de lista pra invocar."
        />
      )}

      {/* ═══ Certificates Tab ═══ */}
      {activeTab === 'certificates' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: 'var(--color-solar-card)', border: '1px solid var(--color-solar-border)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
            <h4 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-solar-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
              mTLS Certificates
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {['venus', 'neptune', 'mars', 'moon', 'saturn', 'sun', 'pluto', 'themis'].map((svc) => (
                <div key={svc} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.625rem 0.75rem', background: 'var(--color-solar-surface)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Lock size={12} style={{ color: 'var(--color-solar-text-muted)' }} />
                    <code style={{ fontSize: '0.8125rem', fontFamily: 'var(--font-mono)', color: 'var(--color-solar-text-primary)' }}>{svc}.solar.internal</code>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--color-solar-text-muted)', fontFamily: 'var(--font-mono)' }}>
                      expires: 2027-01-15
                    </span>
                    <Badge variant="success">valid</Badge>
                    <Button variant="ghost" size="sm">Force Rotation</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cert timeline */}
          <div style={{ background: 'var(--color-solar-card)', border: '1px solid var(--color-solar-border)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
            <h4 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-solar-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
              Certificate Validity Windows
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              {['venus', 'neptune', 'mars', 'moon', 'saturn', 'sun', 'pluto', 'themis'].map((svc) => (
                <div key={svc} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <code style={{ fontSize: '0.6875rem', fontFamily: 'var(--font-mono)', color: 'var(--color-solar-text-muted)', width: '4.5rem' }}>{svc}</code>
                  <div style={{ flex: 1, height: '0.5rem', background: 'var(--color-solar-surface)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ width: '75%', height: '100%', background: 'linear-gradient(90deg, #22C55E 0%, #22C55E 80%, #EAB308 100%)', borderRadius: '2px' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ Access Control Tab ═══ */}
      {activeTab === 'access' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Check Access */}
          <div style={{ background: 'var(--color-solar-card)', border: '1px solid var(--color-solar-border)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
            <h4 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-solar-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
              Check Access
            </h4>
            <form onSubmit={accessForm.handleSubmit((data) => checkAccessMutation.mutate(data))} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '0.75rem', alignItems: 'end' }}>
              <FormField label="Principal" error={accessForm.formState.errors.principal_id?.message}>
                <Input {...accessForm.register('principal_id')} placeholder="user:alice" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }} />
              </FormField>
              <FormField label="Resource" error={accessForm.formState.errors.resource_id?.message}>
                <Input {...accessForm.register('resource_id')} placeholder="document:readme" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }} />
              </FormField>
              <FormField label="Action" error={accessForm.formState.errors.action?.message}>
                <Input {...accessForm.register('action')} placeholder="read" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }} />
              </FormField>
              <Button type="submit" variant="primary" size="sm" disabled={checkAccessMutation.isPending}>
                <Search size={14} /> Check
              </Button>
            </form>
            {accessResult && (
              <div style={{ marginTop: '0.75rem', padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: accessResult.allowed ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${accessResult.allowed ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {accessResult.allowed ? <CheckCircle size={16} style={{ color: '#22C55E' }} /> : <XCircle size={16} style={{ color: '#EF4444' }} />}
                  <span style={{ fontWeight: 600, color: accessResult.allowed ? '#22C55E' : '#EF4444' }}>
                    {accessResult.allowed ? 'ALLOWED' : 'DENIED'}
                  </span>
                  {accessResult.reason && <span style={{ fontSize: '0.8125rem', color: 'var(--color-solar-text-muted)' }}>— {accessResult.reason}</span>}
                </div>
              </div>
            )}
          </div>

          {/* Tuple browser placeholder */}
          <div style={{ background: 'var(--color-solar-card)', border: '1px solid var(--color-solar-border)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
            <h4 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-solar-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
              Relationship Tuples (OpenFGA)
            </h4>
            <DataTable<Tuple>
              columns={TUPLE_COLUMNS}
              data={[]}
              emptyMessage="Enter a search above or browse tuples."
            />
          </div>
        </div>
      )}

      {/* ═══ Anomalies Tab ═══ */}
      {activeTab === 'anomalies' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Threshold config */}
          <div style={{ background: 'var(--color-solar-card)', border: '1px solid var(--color-solar-border)', borderRadius: 'var(--radius-md)', padding: '1rem', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.6875rem', color: 'var(--color-solar-text-muted)' }}>Denial Threshold</span>
              <Input defaultValue="10" type="number" style={{ width: '5rem', fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }} />
            </div>
            <div>
              <span style={{ fontSize: '0.6875rem', color: 'var(--color-solar-text-muted)' }}>Window (seconds)</span>
              <Input defaultValue="300" type="number" style={{ width: '5rem', fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }} />
            </div>
            <Button variant="outline" size="sm">Update Thresholds</Button>
          </div>

          <DataTable<AnomalyEvent>
            columns={ANOMALY_COLUMNS}
            data={[]}
            emptyMessage="No anomalies detected. System secure."
          />
        </div>
      )}

      {/* Mint Modal + Revoke ConfirmDialog removidos com a tokens UI
          (CR22). Voltarão quando R3 implementar list/get/refresh
          (CR24 aberto). */}
    </div>
  );
}
