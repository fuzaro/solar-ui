'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  PageHeader,
  DataTable,
  Badge,
  Button,
  Input,
  Select,
  Modal,
  FormField,
  Checkbox,
  Skeleton,
  AlertBanner,
  ConfirmDialog,
  useToast,
  type ColumnDef,
} from '@solar/ui';
import type { ApiKey, PaginatedResponse } from '@solar/api';
import { useSolar } from '../useSolar';
import { useAuth } from '@solar/auth';
import { Providers } from '../Providers';
import { Plus, Copy, AlertTriangle, KeyRound } from 'lucide-react';

const createKeySchema = z.object({
  label: z.string().min(2, 'Label must be at least 2 characters'),
  scopes: z.array(z.string()).min(1, 'Select at least one scope'),
  expires_in: z.string(),
});

type CreateKeyForm = z.infer<typeof createKeySchema>;

export function ApiKeysPage() {
  return (
    <Providers>
      <ApiKeysPageContent />
    </Providers>
  );
}

function ApiKeysPageContent() {
  const [showCreate, setShowCreate] = useState(false);
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const solar = useSolar();
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const { data, isLoading, error } = useQuery<PaginatedResponse<ApiKey>>({
    queryKey: ['api-keys'],
    queryFn: () => solar.saturn.executions.list({ tenant_id: session?.tenantId, page: 1, page_size: 50 }) as any,
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateKeyForm) => {
      const expiresAt = data.expires_in === 'never' ? null :
        new Date(Date.now() + parseInt(data.expires_in) * 24 * 60 * 60 * 1000).toISOString();
      const response = await fetch(
        `${import.meta.env.PUBLIC_SATURN_URL ?? 'http://localhost:8006'}/v1/api-keys`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.token}`,
          },
          body: JSON.stringify({
            label: data.label,
            scopes: data.scopes,
            expires_at: expiresAt,
          }),
        }
      );
      if (!response.ok) throw new Error('Failed to create API key');
      return response.json();
    },
    onSuccess: (result: any) => {
      setNewKeyValue(result.raw_key ?? result.key_id ?? 'sk-generated-key-value');
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      addToast({ type: 'success', title: 'API key created', description: 'Copy the key now — it won\'t be shown again.' });
    },
    onError: (err: Error) => {
      addToast({ type: 'error', title: 'Failed to create key', description: err.message });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: async (keyId: string) => {
      const response = await fetch(
        `${import.meta.env.PUBLIC_SATURN_URL ?? 'http://localhost:8006'}/v1/api-keys/${keyId}/revoke`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${session?.token}` },
        }
      );
      if (!response.ok) throw new Error('Failed to revoke key');
    },
    onSuccess: () => {
      addToast({ type: 'success', title: 'Key revoked', description: 'The API key has been permanently revoked.' });
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      setRevokeTarget(null);
    },
    onError: (err: Error) => {
      addToast({ type: 'error', title: 'Revoke failed', description: err.message });
    },
  });

  const keys: ApiKey[] = (data as any)?.items ?? [];

  const columns: ColumnDef<ApiKey>[] = [
    {
      key: 'key_id',
      header: 'Key ID',
      width: '160px',
      cell: (v) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--color-solar-text-secondary)' }}>
          {String(v).substring(0, 20)}…
        </span>
      ),
    },
    {
      key: 'label',
      header: 'Label',
      cell: (v) => <span style={{ fontWeight: 500, fontSize: '0.85rem', color: 'var(--color-solar-text-primary)' }}>{String(v)}</span>,
    },
    {
      key: 'scopes',
      header: 'Scopes',
      cell: (v) => (
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          {(v as string[]).map((scope) => (
            <Badge key={scope} variant={scope === 'admin' ? 'error' : scope === 'submit' ? 'info' : 'default'}>{scope}</Badge>
          ))}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (v) => <Badge variant={v === 'active' ? 'success' : 'error'}>{String(v)}</Badge>,
    },
    {
      key: 'expires_at',
      header: 'Expires',
      cell: (v) => (
        <span style={{ fontSize: '0.75rem', color: 'var(--color-solar-text-secondary)' }}>
          {v ? new Date(String(v)).toLocaleDateString() : 'Never'}
        </span>
      ),
    },
    {
      key: 'last_used_at',
      header: 'Last Used',
      cell: (v) => (
        <span style={{ fontSize: '0.75rem', color: 'var(--color-solar-text-secondary)' }}>
          {v ? new Date(String(v)).toLocaleDateString() : 'Never'}
        </span>
      ),
    },
    {
      key: 'key_id',
      header: '',
      width: '80px',
      cell: (v, row) => {
        const key = row as ApiKey;
        return key.status === 'active' ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); setRevokeTarget(String(v)); }}
            style={{ color: 'var(--color-solar-error)', fontSize: '0.75rem' }}
          >
            Revoke
          </Button>
        ) : null;
      },
    },
  ];

  const handleCopy = () => {
    if (newKeyValue) {
      navigator.clipboard.writeText(newKeyValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <PageHeader
          title="API Keys"
          description="Create and manage API keys for programmatic access."
        />
        <Button onClick={() => setShowCreate(true)}>
          <Plus size={16} /> Create API Key
        </Button>
      </div>

      {error && <AlertBanner type="warning" title="Failed to load API keys" description="Check your connection." dismissible />}

      {isLoading ? (
        <Skeleton lines={6} height="40px" />
      ) : (
        <DataTable<ApiKey>
          columns={columns}
          data={keys}
          emptyMessage="No API keys created yet. Create one to access the API programmatically."
        />
      )}

      {/* Create Key Modal */}
      <Modal open={showCreate && !newKeyValue} onClose={() => setShowCreate(false)} title="Create API Key">
        <CreateKeyForm
          onSubmit={(data) => createMutation.mutate(data)}
          loading={createMutation.isPending}
          onCancel={() => setShowCreate(false)}
        />
      </Modal>

      {/* Show New Key Modal */}
      <Modal open={!!newKeyValue} onClose={() => { setNewKeyValue(null); setShowCreate(false); }} title="API Key Created">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', background: 'rgba(234, 179, 8, 0.08)', border: '1px solid rgba(234, 179, 8, 0.3)', borderRadius: 'var(--radius-md)' }}>
            <AlertTriangle size={16} style={{ color: 'var(--color-solar-warning)', flexShrink: 0 }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--color-solar-text-primary)' }}>
              This key will only be shown once. Copy it now and store it securely.
            </span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Input
              value={newKeyValue ?? ''}
              readOnly
              style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}
            />
            <Button variant="ghost" onClick={handleCopy}>
              <Copy size={16} /> {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>
          <Button onClick={() => { setNewKeyValue(null); setShowCreate(false); }}>Done</Button>
        </div>
      </Modal>

      {/* Revoke Confirm */}
      <ConfirmDialog
        open={!!revokeTarget}
        title="Revoke API Key"
        description="Revoking this key is permanent. Any applications using it will immediately lose access."
        confirmLabel="Revoke Key"
        variant="danger"
        onConfirm={() => revokeTarget && revokeMutation.mutate(revokeTarget)}
        onCancel={() => setRevokeTarget(null)}
      />
    </div>
  );
}

function CreateKeyForm({ onSubmit, loading, onCancel }: { onSubmit: (data: CreateKeyForm) => void; loading: boolean; onCancel: () => void }) {
  const form = useForm<CreateKeyForm>({
    resolver: zodResolver(createKeySchema),
    defaultValues: { label: '', scopes: ['submit', 'read'], expires_in: '90' },
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <FormField label="Label" error={form.formState.errors.label?.message}>
        <Controller name="label" control={form.control} render={({ field }) => <Input {...field} placeholder="e.g., CI/CD Pipeline" />} />
      </FormField>
      <FormField label="Scopes" error={form.formState.errors.scopes?.message}>
        <Controller
          name="scopes"
          control={form.control}
          render={({ field }) => (
            <div style={{ display: 'flex', gap: '1rem' }}>
              {['submit', 'read', 'admin'].map((scope) => (
                <label key={scope} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.85rem', cursor: 'pointer', color: 'var(--color-solar-text-primary)' }}>
                  <input
                    type="checkbox"
                    checked={field.value.includes(scope)}
                    onChange={(e) => {
                      if (e.target.checked) field.onChange([...field.value, scope]);
                      else field.onChange(field.value.filter((s) => s !== scope));
                    }}
                    style={{ accentColor: 'var(--color-solar-accent)' }}
                  />
                  {scope}
                </label>
              ))}
            </div>
          )}
        />
      </FormField>
      <FormField label="Expiry">
        <Controller name="expires_in" control={form.control} render={({ field }) => (
          <Select {...field}>
            <option value="30">30 days</option>
            <option value="90">90 days</option>
            <option value="365">1 year</option>
            <option value="never">Never</option>
          </Select>
        )} />
      </FormField>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
        <Button variant="ghost" type="button" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={loading}>{loading ? 'Creating…' : 'Create Key'}</Button>
      </div>
    </form>
  );
}
