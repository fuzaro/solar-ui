'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  PageHeader,
  DataTable,
  Badge,
  Button,
  Modal,
  Input,
  Select,
  FormField,
  StatusDot,
  Skeleton,
  useToast,
  type ColumnDef,
} from '@solar/ui';
import type { Tenant, TenantPlan } from '@solar/api';
import { solar } from '../solarApi';
import { Providers } from '../Providers';
import { Building2, Plus, Search, Eye, Pause } from 'lucide-react';

// ─── Schema ───────────────────────────────────────────────────────────────────

const createTenantSchema = z.object({
  display_name: z.string().min(2).max(128),
  type: z.enum(['individual', 'enterprise', 'community', 'internal']),
  max_concurrent: z.coerce.number().min(1).max(100),
  max_exec_duration_s: z.coerce.number().min(10).max(3600),
  rag_enabled: z.boolean(),
  memory_quota_mb: z.coerce.number().min(64).max(16384),
});

type CreateTenantForm = z.infer<typeof createTenantSchema>;

// ─── Columns ──────────────────────────────────────────────────────────────────

const COLUMNS: ColumnDef<Tenant>[] = [
  {
    key: 'display_name',
    header: 'Tenant',
    sortable: true,
    cell: (v, row) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Building2 size={14} style={{ color: 'var(--color-planet-saturn)' }} />
        <a href={`/tenants?detail=${(row as Tenant).tenant_id}`} style={{ fontWeight: 500, color: 'var(--color-solar-text-primary)', textDecoration: 'none' }}>{String(v)}</a>
      </div>
    ),
  },
  {
    key: 'tenant_id',
    header: 'ID',
    cell: (v) => <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--color-solar-text-secondary)' }}>{String(v)}</span>,
  },
  {
    key: 'type',
    header: 'Type',
    cell: (v) => {
      const colors: Record<string, string> = { enterprise: 'success', individual: 'info', community: 'warning', internal: 'default' };
      return <Badge variant={(colors[String(v)] || 'default') as any}>{String(v)}</Badge>;
    },
  },
  {
    key: 'status',
    header: 'Status',
    cell: (v) => {
      const s = String(v);
      return <StatusDot status={s === 'active' ? 'healthy' : s === 'suspended' ? 'degraded' : 'unreachable'} label={s} />;
    },
  },
  {
    key: 'plan',
    header: 'Max Concurrent',
    cell: (v) => {
      const plan = v as TenantPlan;
      return <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>{plan?.max_concurrent ?? '—'}</span>;
    },
  },
  {
    key: 'plan',
    header: 'Tiers Allowed',
    cell: (v) => {
      const plan = v as TenantPlan;
      if (!plan?.tiers_allowed) return <span style={{ color: 'var(--color-solar-text-secondary)' }}>—</span>;
      return (
        <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
          {plan.tiers_allowed.slice(0, 3).map(t => <Badge key={t} variant="info">{t}</Badge>)}
          {plan.tiers_allowed.length > 3 && <span style={{ fontSize: '0.6875rem', color: 'var(--color-solar-text-secondary)' }}>+{plan.tiers_allowed.length - 3}</span>}
        </div>
      );
    },
  },
  {
    key: 'created_at',
    header: 'Created',
    cell: (v) => <span style={{ fontSize: '0.75rem', color: 'var(--color-solar-text-secondary)' }}>{new Date(String(v)).toLocaleDateString()}</span>,
  },
];

// ─── API helpers (tenant CRUD via Saturn admin) ───────────────────────────────

async function fetchTenants(): Promise<Tenant[]> {
  const config = await solar.saturn.admin.getConfig();
  return (config as any)?.tenants ?? [];
}

async function createTenant(data: { display_name: string; type: string; plan: Partial<TenantPlan> }): Promise<Tenant> {
  const tenant: Tenant = {
    tenant_id: `tn_${Date.now().toString(36)}`,
    display_name: data.display_name,
    type: data.type as any,
    status: 'active',
    plan: {
      tiers_allowed: ['nano', 'standard'],
      max_concurrent: data.plan.max_concurrent ?? 5,
      models_allowed: [],
      max_exec_duration_s: data.plan.max_exec_duration_s ?? 300,
      rag_enabled: data.plan.rag_enabled ?? false,
      memory_quota_mb: data.plan.memory_quota_mb ?? 256,
    },
    created_at: new Date().toISOString(),
  };
  await solar.saturn.admin.setConfig({ action: 'create_tenant', tenant });
  return tenant;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function TenantList() {
  return (
    <Providers>
      <TenantListContent />
    </Providers>
  );
}

function TenantListContent() {
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: tenants, isLoading } = useQuery<Tenant[]>({
    queryKey: ['tenants', 'list'],
    queryFn: fetchTenants,
    refetchInterval: 30_000,
  });

  const createMutation = useMutation({
    mutationFn: createTenant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      toast({ title: 'Tenant created', type: 'success' });
      setShowCreate(false);
    },
    onError: (err: any) => toast({ title: 'Failed to create tenant', description: err?.message, type: 'error' }),
  });

  const allTenants = tenants ?? [];
  const filtered = search ? allTenants.filter(t => t.display_name.toLowerCase().includes(search.toLowerCase()) || t.tenant_id.includes(search)) : allTenants;

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <PageHeader
        title="Tenant Administration"
        description="Manage tenant organisations, access plans, and billing configuration."
        actions={
          <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>
            <Plus size={14} /> Create Tenant
          </Button>
        }
      />

      {/* Search */}
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1', maxWidth: '360px' }}>
          <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-solar-text-secondary)' }} />
          <Input placeholder="Search tenants..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: '2rem' }} />
        </div>
        <span style={{ fontSize: '0.8125rem', color: 'var(--color-solar-text-secondary)' }}>
          {filtered.length} tenant{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      {isLoading ? (
        <Skeleton lines={8} height="40px" />
      ) : (
        <DataTable<Tenant>
          columns={COLUMNS}
          data={filtered}
          emptyMessage="No tenants registered. Create one to start onboarding users."
        />
      )}

      {/* Create Modal */}
      {showCreate && (
        <CreateTenantModal
          open={showCreate}
          onClose={() => setShowCreate(false)}
          onSubmit={(data) => createMutation.mutate(data)}
          isLoading={createMutation.isPending}
        />
      )}
    </div>
  );
}

// ─── Create Tenant Modal ──────────────────────────────────────────────────────

function CreateTenantModal({ open, onClose, onSubmit, isLoading }: { open: boolean; onClose: () => void; onSubmit: (d: any) => void; isLoading: boolean }) {
  const { register, handleSubmit, formState: { errors } } = useForm<CreateTenantForm>({
    resolver: zodResolver(createTenantSchema),
    defaultValues: { type: 'individual', max_concurrent: 5, max_exec_duration_s: 300, rag_enabled: false, memory_quota_mb: 256 },
  });

  const submit = handleSubmit((data) => {
    onSubmit({
      display_name: data.display_name,
      type: data.type,
      plan: { max_concurrent: data.max_concurrent, max_exec_duration_s: data.max_exec_duration_s, rag_enabled: data.rag_enabled, memory_quota_mb: data.memory_quota_mb },
    });
  });

  return (
    <Modal title="Create Tenant" open={open} onClose={onClose} size="md">
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <FormField label="Display Name" error={errors.display_name?.message}>
            <Input {...register('display_name')} placeholder="Acme Corp" />
          </FormField>
          <FormField label="Type" error={errors.type?.message}>
            <Select {...register('type')}>
              <option value="individual">Individual</option>
              <option value="enterprise">Enterprise</option>
              <option value="community">Community</option>
              <option value="internal">Internal</option>
            </Select>
          </FormField>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <FormField label="Max Concurrent" error={errors.max_concurrent?.message}>
            <Input {...register('max_concurrent')} type="number" min={1} max={100} />
          </FormField>
          <FormField label="Max Duration (s)" error={errors.max_exec_duration_s?.message}>
            <Input {...register('max_exec_duration_s')} type="number" min={10} />
          </FormField>
          <FormField label="Memory Quota (MB)" error={errors.memory_quota_mb?.message}>
            <Input {...register('memory_quota_mb')} type="number" min={64} />
          </FormField>
        </div>

        <FormField label="RAG Enabled">
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input type="checkbox" {...register('rag_enabled')} />
            <span style={{ fontSize: '0.8125rem' }}>Enable RAG for this tenant</span>
          </label>
        </FormField>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={isLoading}>{isLoading ? 'Creating...' : 'Create Tenant'}</Button>
        </div>
      </form>
    </Modal>
  );
}
