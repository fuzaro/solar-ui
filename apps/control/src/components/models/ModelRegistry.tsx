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
import type { Model, PaginatedResponse } from '@solar/api';
import { solar } from '../solarApi';
import { Providers } from '../Providers';
import { Cpu, Plus, Search, Star } from 'lucide-react';

// ─── Schema ───────────────────────────────────────────────────────────────────

const modelSchema = z.object({
  model_id: z.string().min(2),
  display_name: z.string().min(2),
  provider_id: z.string().min(1),
  tier: z.enum(['nano', 'standard', 'advanced', 'specialized']),
  context_window: z.coerce.number().min(1024),
  priority: z.coerce.number().min(0).max(100),
  capabilities: z.string().optional(),
});

type ModelFormData = z.infer<typeof modelSchema>;

// ─── Columns ──────────────────────────────────────────────────────────────────

const COLUMNS: ColumnDef<Model>[] = [
  {
    key: 'display_name',
    header: 'Model',
    sortable: true,
    cell: (v, row) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Cpu size={14} style={{ color: 'var(--color-planet-neptune)' }} />
        <a href={`/models/registry?detail=${(row as Model).model_id}`} style={{ color: 'var(--color-solar-text-primary)', fontWeight: 500, textDecoration: 'none' }}>{String(v)}</a>
      </div>
    ),
  },
  {
    key: 'model_id',
    header: 'ID',
    cell: (v) => <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--color-solar-text-secondary)' }}>{String(v)}</span>,
  },
  {
    key: 'provider_id',
    header: 'Provider',
    cell: (v) => <a href={`/models/providers`} style={{ fontSize: '0.8125rem', color: 'var(--color-planet-neptune)', textDecoration: 'none' }}>{String(v)}</a>,
  },
  {
    key: 'tier',
    header: 'Tier',
    sortable: true,
    cell: (v) => {
      const c: Record<string, string> = { nano: 'default', standard: 'info', advanced: 'success', specialized: 'warning' };
      return <Badge variant={(c[String(v)] || 'default') as any}>{String(v)}</Badge>;
    },
  },
  {
    key: 'context_window',
    header: 'Context',
    sortable: true,
    cell: (v) => <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>{(Number(v) / 1024).toFixed(0)}K</span>,
  },
  {
    key: 'priority',
    header: 'Priority',
    sortable: true,
    cell: (v) => {
      const p = Number(v);
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <div style={{ width: '40px', height: '6px', background: 'var(--color-solar-border)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${p}%`, height: '100%', background: 'var(--color-planet-neptune)', borderRadius: '3px' }} />
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{p}</span>
        </div>
      );
    },
  },
  {
    key: 'quality_score',
    header: 'Quality',
    sortable: true,
    cell: (v) => {
      const score = Number(v);
      const color = score >= 0.9 ? 'var(--color-aura-green)' : score >= 0.7 ? 'var(--color-aura-yellow)' : 'var(--color-aura-red)';
      return <span style={{ color, fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', fontWeight: 600 }}>{(score * 100).toFixed(1)}%</span>;
    },
  },
  {
    key: 'status',
    header: 'Status',
    cell: (v) => {
      const s = String(v);
      return <StatusDot status={s === 'available' ? 'healthy' : s === 'deprecated' ? 'degraded' : 'unreachable'} label={s} />;
    },
  },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export function ModelRegistry() {
  return (
    <Providers>
      <ModelRegistryContent />
    </Providers>
  );
}

function ModelRegistryContent() {
  const [showRegister, setShowRegister] = useState(false);
  const [filterTier, setFilterTier] = useState('');
  const [filterProvider, setFilterProvider] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useQuery<PaginatedResponse<Model>>({
    queryKey: ['models', 'list', page, filterTier, filterProvider],
    queryFn: () => solar.neptune.models.list({
      ...(filterTier && { tier: filterTier }),
      ...(filterProvider && { provider_id: filterProvider }),
    }),
    refetchInterval: 30_000,
  });

  const registerMutation = useMutation({
    mutationFn: (data: Partial<Model>) => solar.neptune.models.register(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['models'] });
      toast({ title: 'Model registered', type: 'success' });
      setShowRegister(false);
    },
    onError: (err: any) => toast({ title: 'Registration failed', description: err?.message, type: 'error' }),
  });

  const models = data?.items ?? [];
  const filtered = search ? models.filter(m => m.display_name.toLowerCase().includes(search.toLowerCase()) || m.model_id.includes(search.toLowerCase())) : models;

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <PageHeader
        title="Model Registry"
        description="Browse, register, and configure inference models across all providers."
        actions={
          <Button variant="primary" size="sm" onClick={() => setShowRegister(true)}>
            <Plus size={14} /> Register Model
          </Button>
        }
      />

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1', maxWidth: '320px' }}>
          <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-solar-text-secondary)' }} />
          <Input placeholder="Search models..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: '2rem' }} />
        </div>
        <Select value={filterTier} onChange={(e) => { setFilterTier(e.target.value); setPage(1); }}>
          <option value="">All Tiers</option>
          <option value="nano">Nano</option>
          <option value="standard">Standard</option>
          <option value="advanced">Advanced</option>
          <option value="specialized">Specialized</option>
        </Select>
      </div>

      {isLoading ? (
        <Skeleton lines={10} height="40px" />
      ) : (
        <DataTable<Model>
          columns={COLUMNS}
          data={filtered}
          emptyMessage="No models registered. Add a provider and discover models."
          pagination={data ? { page: data.page, pageSize: data.page_size, total: data.total, onPageChange: setPage } : undefined}
        />
      )}

      {/* Register Modal */}
      {showRegister && (
        <Modal title="Register Model" open={showRegister} onClose={() => setShowRegister(false)} size="md">
          <RegisterModelForm onSubmit={(d) => registerMutation.mutate(d)} onCancel={() => setShowRegister(false)} isLoading={registerMutation.isPending} />
        </Modal>
      )}
    </div>
  );
}

// ─── Register Form ────────────────────────────────────────────────────────────

function RegisterModelForm({ onSubmit, onCancel, isLoading }: { onSubmit: (d: Partial<Model>) => void; onCancel: () => void; isLoading: boolean }) {
  const { register, handleSubmit, formState: { errors } } = useForm<ModelFormData>({
    resolver: zodResolver(modelSchema),
    defaultValues: { tier: 'standard', priority: 50, context_window: 8192 },
  });

  const submit = handleSubmit((data) => {
    onSubmit({
      model_id: data.model_id,
      display_name: data.display_name,
      provider_id: data.provider_id,
      tier: data.tier,
      context_window: data.context_window,
      priority: data.priority,
      capabilities: data.capabilities ? data.capabilities.split(',').map(c => c.trim()) : [],
    });
  });

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <FormField label="Model ID" error={errors.model_id?.message}>
          <Input {...register('model_id')} placeholder="llama3.2:3b" />
        </FormField>
        <FormField label="Display Name" error={errors.display_name?.message}>
          <Input {...register('display_name')} placeholder="Llama 3.2 3B" />
        </FormField>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
        <FormField label="Provider ID" error={errors.provider_id?.message}>
          <Input {...register('provider_id')} placeholder="ollama-local" />
        </FormField>
        <FormField label="Tier" error={errors.tier?.message}>
          <Select {...register('tier')}>
            <option value="nano">Nano</option>
            <option value="standard">Standard</option>
            <option value="advanced">Advanced</option>
            <option value="specialized">Specialized</option>
          </Select>
        </FormField>
        <FormField label="Context Window" error={errors.context_window?.message}>
          <Input {...register('context_window')} type="number" />
        </FormField>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <FormField label="Priority (0-100)" error={errors.priority?.message}>
          <Input {...register('priority')} type="number" min={0} max={100} />
        </FormField>
        <FormField label="Capabilities (comma-separated)" error={errors.capabilities?.message}>
          <Input {...register('capabilities')} placeholder="chat, code, reasoning" />
        </FormField>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="primary" disabled={isLoading}>{isLoading ? 'Registering...' : 'Register Model'}</Button>
      </div>
    </form>
  );
}
