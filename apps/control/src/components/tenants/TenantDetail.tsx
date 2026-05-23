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
  Select,
  Switch,
  FormField,
  Skeleton,
  QuotaBar,
  useToast,
  type ColumnDef,
} from '@solar/ui';
import type { Tenant, Principal, BudgetLedgerEntry, PaginatedResponse } from '@solar/api';
import { solar } from '../solarApi';
import { ArrowLeft, Settings, Users, Wallet, Database } from 'lucide-react';

// ─── Plan Schema ──────────────────────────────────────────────────────────────

const planSchema = z.object({
  max_concurrent: z.coerce.number().min(1).max(100),
  max_exec_duration_s: z.coerce.number().min(10).max(3600),
  rag_enabled: z.boolean(),
  memory_quota_mb: z.coerce.number().min(64).max(16384),
});

const grantSchema = z.object({
  amount: z.coerce.number().min(1),
  description: z.string().min(1).max(256),
});

// ─── Member Columns ───────────────────────────────────────────────────────────

const MEMBER_COLUMNS: ColumnDef<Principal>[] = [
  { key: 'display_name', header: 'Name', cell: (v) => <span style={{ fontWeight: 500 }}>{String(v)}</span> },
  { key: 'email', header: 'Email', cell: (v) => <span style={{ fontSize: '0.8125rem', color: 'var(--color-solar-text-secondary)' }}>{String(v)}</span> },
  { key: 'role', header: 'Role', cell: (v) => { const r = String(v); return <Badge variant={r === 'admin' ? 'success' : r === 'member' ? 'info' : 'default'}>{r}</Badge>; } },
  { key: 'type', header: 'Type', cell: (v) => <Badge variant="default">{String(v)}</Badge> },
  { key: 'status', header: 'Status', cell: (v) => <Badge variant={String(v) === 'active' ? 'success' : 'error'}>{String(v)}</Badge> },
];

// ─── Ledger Columns ───────────────────────────────────────────────────────────

const LEDGER_COLUMNS: ColumnDef<BudgetLedgerEntry>[] = [
  { key: 'operation', header: 'Operation', cell: (v) => { const op = String(v); const c: Record<string, string> = { credit: 'success', debit: 'error', grant: 'info', reset: 'warning' }; return <Badge variant={(c[op] || 'default') as any}>{op}</Badge>; } },
  { key: 'amount', header: 'Amount', cell: (v) => { const amt = Number(v); const color = amt >= 0 ? 'var(--color-aura-green)' : 'var(--color-aura-red)'; return <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color }}>{amt >= 0 ? '+' : ''}{amt.toFixed(2)}</span>; } },
  { key: 'balance_after', header: 'Balance After', cell: (v) => <span style={{ fontFamily: 'var(--font-mono)' }}>{Number(v).toFixed(2)}</span> },
  { key: 'description', header: 'Description', cell: (v) => <span style={{ fontSize: '0.8125rem', color: 'var(--color-solar-text-secondary)' }}>{String(v || '—')}</span> },
  { key: 'created_at', header: 'Date', cell: (v) => <span style={{ fontSize: '0.75rem', color: 'var(--color-solar-text-secondary)' }}>{new Date(String(v)).toLocaleString()}</span> },
];

// ─── Main Component ───────────────────────────────────────────────────────────

interface TenantDetailProps {
  tenantId: string;
  onBack?: () => void;
}

export function TenantDetail({ tenantId, onBack }: TenantDetailProps) {
  const [activeTab, setActiveTab] = useState('plan');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: tenants } = useQuery<Tenant[]>({
    queryKey: ['tenants', 'list'],
    queryFn: async () => { const cfg = await solar.saturn.admin.getConfig(); return (cfg as any)?.tenants ?? []; },
  });

  const tenant = tenants?.find(t => t.tenant_id === tenantId);

  const { data: budget } = useQuery({
    queryKey: ['tenants', 'budget', tenantId],
    queryFn: () => solar.mars.budget.get(tenantId),
    enabled: !!tenantId,
  });

  const { data: ledger } = useQuery<PaginatedResponse<BudgetLedgerEntry>>({
    queryKey: ['tenants', 'ledger', tenantId],
    queryFn: () => solar.mars.budget.ledger(tenantId, { page: 1, page_size: 20 }),
    enabled: !!tenantId,
  });

  const grantMutation = useMutation({
    mutationFn: (data: { amount: number; description?: string }) => solar.mars.budget.grant(tenantId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants', 'budget', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['tenants', 'ledger', tenantId] });
      toast({ title: 'Credits granted', type: 'success' });
    },
    onError: (err: any) => toast({ title: 'Grant failed', description: err?.message, type: 'error' }),
  });

  const { register: registerGrant, handleSubmit: handleGrant, reset: resetGrant, formState: { errors: grantErrors } } = useForm({
    resolver: zodResolver(grantSchema),
    defaultValues: { amount: 100, description: '' },
  });

  if (!tenant) {
    return <div style={{ padding: '2rem' }}><Skeleton lines={10} height="40px" /></div>;
  }

  const tabs = [
    { id: 'plan', label: 'Plan Configuration', icon: <Settings size={14} /> },
    { id: 'members', label: 'Members', icon: <Users size={14} /> },
    { id: 'budget', label: 'Budget', icon: <Wallet size={14} /> },
    { id: 'resources', label: 'Resources', icon: <Database size={14} /> },
  ];

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
        {onBack && <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft size={16} /></Button>}
        <PageHeader
          title={tenant.display_name}
          description={`Tenant ID: ${tenant.tenant_id} · Created: ${new Date(tenant.created_at).toLocaleDateString()}`}
          actions={
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Badge variant={tenant.type === 'enterprise' ? 'success' : 'info'}>{tenant.type}</Badge>
              <Badge variant={tenant.status === 'active' ? 'success' : 'error'}>{tenant.status}</Badge>
            </div>
          }
        />
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Plan Configuration Tab */}
      {activeTab === 'plan' && (
        <Card title="Plan Configuration">
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <p style={{ margin: '0 0 0.5rem', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-solar-text-primary)' }}>Tiers Allowed</p>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {(['nano', 'standard', 'advanced', 'specialized', 'ops_only'] as const).map(tier => (
                    <Badge key={tier} variant={tenant.plan.tiers_allowed.includes(tier) ? 'info' : 'default'} style={{ opacity: tenant.plan.tiers_allowed.includes(tier) ? 1 : 0.4 }}>{tier}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <p style={{ margin: '0 0 0.5rem', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-solar-text-primary)' }}>Max Concurrent Executions</p>
                <QuotaBar used={0} limit={tenant.plan.max_concurrent} label={`${tenant.plan.max_concurrent} slots`} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
              <div>
                <p style={{ margin: '0 0 0.25rem', fontSize: '0.75rem', color: 'var(--color-solar-text-secondary)' }}>Max Exec Duration</p>
                <p style={{ margin: 0, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{tenant.plan.max_exec_duration_s}s</p>
              </div>
              <div>
                <p style={{ margin: '0 0 0.25rem', fontSize: '0.75rem', color: 'var(--color-solar-text-secondary)' }}>RAG Enabled</p>
                <Badge variant={tenant.plan.rag_enabled ? 'success' : 'default'}>{tenant.plan.rag_enabled ? 'Yes' : 'No'}</Badge>
              </div>
              <div>
                <p style={{ margin: '0 0 0.25rem', fontSize: '0.75rem', color: 'var(--color-solar-text-secondary)' }}>Memory Quota</p>
                <p style={{ margin: 0, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{tenant.plan.memory_quota_mb} MB</p>
              </div>
            </div>
            {tenant.plan.models_allowed.length > 0 && (
              <div>
                <p style={{ margin: '0 0 0.5rem', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-solar-text-primary)' }}>Models Allowed</p>
                <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                  {tenant.plan.models_allowed.map(m => <Badge key={m} variant="info">{m}</Badge>)}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Members Tab */}
      {activeTab === 'members' && (
        <Card title="Members & Principals">
          <div style={{ padding: '1rem' }}>
            <DataTable<Principal>
              columns={MEMBER_COLUMNS}
              data={[]}
              emptyMessage="No members loaded. Connect Saturn identity service to view principals."
            />
          </div>
        </Card>
      )}

      {/* Budget Tab */}
      {activeTab === 'budget' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <Card title="Current Balance">
              <div style={{ padding: '1rem', textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: '2rem', fontWeight: 700, color: 'var(--color-planet-saturn)' }}>{budget?.balance?.toFixed(2) ?? '—'}</p>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-solar-text-secondary)' }}>credits</p>
              </div>
            </Card>
            <Card title="Total Spent">
              <div style={{ padding: '1rem', textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: '2rem', fontWeight: 700, color: 'var(--color-aura-red)' }}>{budget?.spent?.toFixed(2) ?? '—'}</p>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-solar-text-secondary)' }}>credits used</p>
              </div>
            </Card>
            <Card title="Budget Limit">
              <div style={{ padding: '1rem', textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: '2rem', fontWeight: 700, color: 'var(--color-solar-text-primary)' }}>{budget?.limit?.toFixed(2) ?? '—'}</p>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-solar-text-secondary)' }}>total limit</p>
              </div>
            </Card>
          </div>

          {/* Grant Form */}
          <Card title="Grant Credits">
            <form onSubmit={handleGrant((data) => { grantMutation.mutate(data); resetGrant(); })} style={{ padding: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
              <FormField label="Amount" error={grantErrors.amount?.message} style={{ width: '120px' }}>
                <Input {...registerGrant('amount')} type="number" min={1} />
              </FormField>
              <FormField label="Description" error={grantErrors.description?.message} style={{ flex: 1 }}>
                <Input {...registerGrant('description')} placeholder="Reason for credit grant..." />
              </FormField>
              <Button type="submit" variant="primary" size="sm" disabled={grantMutation.isPending}>
                {grantMutation.isPending ? 'Granting...' : 'Grant Credits'}
              </Button>
            </form>
          </Card>

          {/* Ledger */}
          <Card title="Budget Ledger">
            <DataTable<BudgetLedgerEntry>
              columns={LEDGER_COLUMNS}
              data={ledger?.items ?? []}
              emptyMessage="No budget transactions yet."
            />
          </Card>
        </div>
      )}

      {/* Resources Tab */}
      {activeTab === 'resources' && (
        <Card title="Tenant Resources">
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-solar-text-secondary)' }}>
            <Database size={32} style={{ marginBottom: '0.75rem', opacity: 0.5 }} />
            <p style={{ margin: 0, fontSize: '0.875rem' }}>Resource listing requires Sun resource registry connection.</p>
            <Button variant="secondary" size="sm" style={{ marginTop: '1rem' }} onClick={() => window.location.href = `/tenants`}>
              Configure Resources
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
