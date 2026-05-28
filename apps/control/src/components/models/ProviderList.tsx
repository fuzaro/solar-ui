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
import type { Provider, CreateProviderRequest } from '@solar/api';
import { solar } from '../solarApi';
import { Providers } from '../Providers';
import { Server, Plus, RefreshCw, Trash2, Heart, Zap } from 'lucide-react';

// ─── Schema ───────────────────────────────────────────────────────────────────

const providerSchema = z.object({
  display_name: z.string().min(2).max(128),
  type: z.enum(['ollama', 'openai_compatible']),
  base_url: z.string().url('Must be a valid URL'),
  auth_type: z.enum(['none', 'bearer', 'api_key']),
  auth_token: z.string().optional(),
});

type ProviderFormData = z.infer<typeof providerSchema>;

// ─── Columns ──────────────────────────────────────────────────────────────────

const COLUMNS: ColumnDef<Provider>[] = [
  {
    key: 'display_name',
    header: 'Provider',
    sortable: true,
    cell: (v) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Server size={14} style={{ color: 'var(--color-planet-neptune)' }} />
        <span style={{ fontWeight: 500, color: 'var(--color-solar-text-primary)' }}>{String(v)}</span>
      </div>
    ),
  },
  {
    key: 'provider_id',
    header: 'ID',
    cell: (v) => <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-solar-text-secondary)' }}>{String(v)}</span>,
  },
  {
    key: 'type',
    header: 'Type',
    cell: (v) => <Badge variant={String(v) === 'ollama' ? 'info' : 'success'}>{String(v)}</Badge>,
  },
  {
    key: 'base_url',
    header: 'Base URL',
    cell: (v) => <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-solar-text-secondary)' }}>{String(v)}</span>,
  },
  {
    key: 'status',
    header: 'Status',
    cell: (v) => <StatusDot status={String(v) as any} label={String(v)} />,
  },
  {
    key: 'model_count',
    header: 'Models',
    sortable: true,
    cell: (v) => <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-planet-neptune)' }}>{String(v)}</span>,
  },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export function ProviderList() {
  return (
    <Providers>
      <ProviderListContent />
    </Providers>
  );
}

function ProviderListContent() {
  const [showRegister, setShowRegister] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: providers, isLoading } = useQuery<Provider[]>({
    queryKey: ['providers', 'list'],
    queryFn: () => solar.neptune.providers.list(),
    refetchInterval: 30_000,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateProviderRequest) => solar.neptune.providers.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['providers'] });
      toast({ title: 'Provider registered', description: 'New provider added successfully.', type: 'success' });
      setShowRegister(false);
    },
    onError: (err: any) => toast({ title: 'Failed to register provider', description: err?.message, type: 'error' }),
  });

  // syncMutation removido em v0.1.6 (CR29) — Neptune não publica
  // /v1/providers/{id}/sync (R5 inventou). Botões Discover/Health
  // removidos das rowActions abaixo.

  const deleteMutation = useMutation({
    mutationFn: (providerId: string) => solar.neptune.providers.delete(providerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['providers'] });
      toast({ title: 'Provider deleted', type: 'success' });
    },
  });

  const rowActions = (row: Provider) => (
    <div style={{ display: 'flex', gap: '0.25rem' }}>
      <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(row.provider_id)} title="Delete" style={{ color: 'var(--color-aura-red)' }}>
        <Trash2 size={14} />
      </Button>
    </div>
  );

  const columnsWithActions: ColumnDef<Provider>[] = [
    ...COLUMNS,
    { key: 'provider_id' as any, header: 'Actions', cell: (_, row) => rowActions(row as Provider) },
  ];

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <PageHeader
        title="Model Providers"
        description="Manage Ollama and OpenAI-compatible model providers."
        actions={
          <Button variant="primary" size="sm" onClick={() => setShowRegister(true)}>
            <Plus size={14} /> Register Provider
          </Button>
        }
      />

      {isLoading ? (
        <Skeleton lines={8} height="40px" />
      ) : (
        <DataTable<Provider>
          columns={columnsWithActions}
          data={providers ?? []}
          emptyMessage="No providers registered. Add one to discover models."
        />
      )}

      {/* ── Register Modal ── */}
      {showRegister && (
        <RegisterProviderModal
          open={showRegister}
          onClose={() => setShowRegister(false)}
          onSubmit={(data) => createMutation.mutate(data)}
          isLoading={createMutation.isPending}
        />
      )}
    </div>
  );
}

// ─── Register Provider Modal ──────────────────────────────────────────────────

function RegisterProviderModal({ open, onClose, onSubmit, isLoading }: { open: boolean; onClose: () => void; onSubmit: (d: CreateProviderRequest) => void; isLoading: boolean }) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<ProviderFormData>({
    resolver: zodResolver(providerSchema),
    defaultValues: { type: 'ollama', auth_type: 'none' },
  });

  const authType = watch('auth_type');

  const submit = handleSubmit((data) => {
    onSubmit({
      display_name: data.display_name,
      type: data.type,
      base_url: data.base_url,
      auth_type: data.auth_type,
      auth_token: data.auth_token,
    });
  });

  return (
    <Modal title="Register Provider" open={open} onClose={onClose} size="md">
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <FormField label="Display Name" error={errors.display_name?.message}>
          <Input {...register('display_name')} placeholder="My Ollama Instance" />
        </FormField>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <FormField label="Type" error={errors.type?.message}>
            <Select {...register('type')}>
              <option value="ollama">Ollama</option>
              <option value="openai_compatible">OpenAI Compatible</option>
            </Select>
          </FormField>
          <FormField label="Auth Type" error={errors.auth_type?.message}>
            <Select {...register('auth_type')}>
              <option value="none">None</option>
              <option value="bearer">Bearer Token</option>
              <option value="api_key">API Key</option>
            </Select>
          </FormField>
        </div>

        <FormField label="Base URL" error={errors.base_url?.message}>
          <Input {...register('base_url')} placeholder="http://localhost:11434" />
        </FormField>

        {authType !== 'none' && (
          <FormField label={authType === 'bearer' ? 'Bearer Token' : 'API Key'} error={errors.auth_token?.message}>
            <Input {...register('auth_token')} type="password" placeholder="Enter token..." />
          </FormField>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={isLoading}>{isLoading ? 'Registering...' : 'Register Provider'}</Button>
        </div>
      </form>
    </Modal>
  );
}
