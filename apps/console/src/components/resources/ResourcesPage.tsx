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
  StatusDot,
  Skeleton,
  AlertBanner,
  ConfirmDialog,
  useToast,
  type ColumnDef,
} from '@solar/ui';
import type { Resource, PaginatedResponse, ResourceType, ResourceSensitivity } from '@solar/api';
import { useSolar } from '../useSolar';
import { useAuth } from '@solar/auth';
import { Providers } from '../Providers';
import { Plus, Trash2, Edit, RefreshCw, Search } from 'lucide-react';

const RESOURCE_TYPES: ResourceType[] = ['database', 'api', 'file_storage', 'cloud_storage', 'integration', 'message_queue', 'model', 'internal_service', 'rag_index', 'mcp_server', 'function'];
const SENSITIVITY_LEVELS: ResourceSensitivity[] = ['Public', 'Internal', 'Confidential', 'Restricted'];
const ALLOWED_ACTIONS = ['read', 'write', 'execute', 'subscribe', 'publish', 'query', 'upsert', 'invoke'];

const resourceSchema = z.object({
  resource_id: z.string().min(3, 'Resource ID must be at least 3 characters'),
  display_name: z.string().min(2, 'Display name is required'),
  type: z.string().min(1, 'Type is required'),
  endpoint: z.string().url('Must be a valid URL'),
  sensitivity: z.string().min(1, 'Sensitivity is required'),
  allowed_actions: z.array(z.string()).min(1, 'Select at least one action'),
  description: z.string().optional(),
});

type ResourceFormData = z.infer<typeof resourceSchema>;

export function ResourcesPage() {
  return (
    <Providers>
      <ResourcesPageContent />
    </Providers>
  );
}

function ResourcesPageContent() {
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<Resource | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState('');
  const [sensitivityFilter, setSensitivityFilter] = useState('');
  const [healthFilter, setHealthFilter] = useState('');
  const solar = useSolar();
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const { data, isLoading, error } = useQuery<PaginatedResponse<Resource>>({
    queryKey: ['resources', typeFilter, session?.tenantId],
    // CR33 — Sun /v1/resources exige tenant_id required (ADR-007 §D5);
    // sem ele → 422. enabled gate evita chamada antes da session.
    queryFn: () => solar.sun.resources.list({ tenant_id: session?.tenantId, type: typeFilter || undefined, page: 1 }),
    enabled: !!session?.tenantId,
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<Resource>) => solar.sun.resources.register(data),
    onSuccess: () => {
      addToast({ type: 'success', title: 'Resource registered', description: 'New resource has been added.' });
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      setShowCreate(false);
    },
    onError: (err: Error) => {
      addToast({ type: 'error', title: 'Registration failed', description: err.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Resource> }) => solar.sun.resources.update(id, data),
    onSuccess: () => {
      addToast({ type: 'success', title: 'Resource updated', description: 'Changes saved successfully.' });
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      setEditTarget(null);
    },
    onError: (err: Error) => {
      addToast({ type: 'error', title: 'Update failed', description: err.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => solar.sun.resources.delete(id),
    onSuccess: () => {
      addToast({ type: 'success', title: 'Resource deleted', description: 'The resource has been removed.' });
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      setDeleteTarget(null);
    },
    onError: (err: Error) => {
      addToast({ type: 'error', title: 'Delete failed', description: err.message });
    },
  });

  let resources = data?.items ?? [];
  if (sensitivityFilter) resources = resources.filter((r) => r.sensitivity === sensitivityFilter);
  if (healthFilter) resources = resources.filter((r) => r.health === healthFilter);

  const columns: ColumnDef<Resource>[] = [
    {
      key: 'display_name',
      header: 'Name',
      cell: (v) => <span style={{ fontWeight: 500, fontSize: '0.85rem', color: 'var(--color-solar-text-primary)' }}>{String(v)}</span>,
    },
    {
      key: 'type',
      header: 'Type',
      cell: (v) => <Badge variant="default">{String(v)}</Badge>,
    },
    {
      key: 'sensitivity',
      header: 'Sensitivity',
      cell: (v) => {
        const s = String(v);
        const variant = s === 'Public' ? 'success' : s === 'Internal' ? 'info' : s === 'Confidential' ? 'warning' : 'error';
        return <Badge variant={variant}>{s}</Badge>;
      },
    },
    {
      key: 'health',
      header: 'Health',
      cell: (v) => {
        const h = String(v);
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <StatusDot status={h as any} />
            <span style={{ fontSize: '0.75rem', color: 'var(--color-solar-text-secondary)', textTransform: 'capitalize' }}>{h}</span>
          </div>
        );
      },
    },
    {
      key: 'endpoint',
      header: 'Endpoint',
      cell: (v) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--color-solar-text-secondary)', maxWidth: '200px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {String(v)}
        </span>
      ),
    },
    {
      key: 'resource_id',
      header: 'Actions',
      width: '120px',
      cell: (_v, row) => {
        const r = row as Resource;
        return (
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setEditTarget(r); }}>
              <Edit size={14} />
            </Button>
            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setDeleteTarget(r.resource_id); }} style={{ color: 'var(--color-solar-error)' }}>
              <Trash2 size={14} />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <PageHeader
          title="Resources"
          description="Manage data sources, APIs, and integrations available to your tasks."
        />
        <Button onClick={() => setShowCreate(true)}>
          <Plus size={16} /> Register Resource
        </Button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={{ width: '160px', fontSize: '0.8rem' }}>
          <option value="">All Types</option>
          {RESOURCE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </Select>
        <Select value={sensitivityFilter} onChange={(e) => setSensitivityFilter(e.target.value)} style={{ width: '160px', fontSize: '0.8rem' }}>
          <option value="">All Sensitivity</option>
          {SENSITIVITY_LEVELS.map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
        <Select value={healthFilter} onChange={(e) => setHealthFilter(e.target.value)} style={{ width: '160px', fontSize: '0.8rem' }}>
          <option value="">All Health</option>
          <option value="healthy">Healthy</option>
          <option value="degraded">Degraded</option>
          <option value="unreachable">Unreachable</option>
        </Select>
      </div>

      {error && <AlertBanner type="warning" title="Failed to load resources" description="Check your connection." dismissible />}

      {isLoading ? (
        <Skeleton lines={8} height="40px" />
      ) : (
        <DataTable<Resource>
          columns={columns}
          data={resources}
          emptyMessage="No resources registered yet. Click 'Register Resource' to add one."
        />
      )}

      {/* Create Modal */}
      <ResourceModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={(data) => createMutation.mutate(data)}
        loading={createMutation.isPending}
        title="Register Resource"
      />

      {/* Edit Modal */}
      {editTarget && (
        <ResourceModal
          open={!!editTarget}
          onClose={() => setEditTarget(null)}
          onSubmit={(data) => updateMutation.mutate({ id: editTarget.resource_id, data })}
          loading={updateMutation.isPending}
          title="Edit Resource"
          defaults={editTarget}
        />
      )}

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Resource"
        description="Are you sure you want to delete this resource? Tasks using it will lose access."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function ResourceModal({ open, onClose, onSubmit, loading, title, defaults }: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Resource>) => void;
  loading: boolean;
  title: string;
  defaults?: Resource;
}) {
  const form = useForm<ResourceFormData>({
    resolver: zodResolver(resourceSchema),
    defaultValues: defaults ? {
      resource_id: defaults.resource_id,
      display_name: defaults.display_name,
      type: defaults.type,
      endpoint: defaults.endpoint,
      sensitivity: defaults.sensitivity,
      allowed_actions: defaults.allowed_actions,
      description: defaults.description ?? '',
    } : {
      resource_id: '',
      display_name: '',
      type: '',
      endpoint: '',
      sensitivity: '',
      allowed_actions: [],
      description: '',
    },
  });

  const handleSubmit = form.handleSubmit((data) => {
    onSubmit({
      resource_id: data.resource_id,
      display_name: data.display_name,
      type: data.type as ResourceType,
      endpoint: data.endpoint,
      sensitivity: data.sensitivity as ResourceSensitivity,
      allowed_actions: data.allowed_actions,
      description: data.description,
    } as Partial<Resource>);
  });

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <FormField label="Resource ID" error={form.formState.errors.resource_id?.message}>
          <Controller name="resource_id" control={form.control} render={({ field }) => <Input {...field} placeholder="my-database" disabled={!!defaults} />} />
        </FormField>
        <FormField label="Display Name" error={form.formState.errors.display_name?.message}>
          <Controller name="display_name" control={form.control} render={({ field }) => <Input {...field} placeholder="My Production DB" />} />
        </FormField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <FormField label="Type" error={form.formState.errors.type?.message}>
            <Controller name="type" control={form.control} render={({ field }) => (
              <Select {...field}>
                <option value="">Select type…</option>
                {RESOURCE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </Select>
            )} />
          </FormField>
          <FormField label="Sensitivity" error={form.formState.errors.sensitivity?.message}>
            <Controller name="sensitivity" control={form.control} render={({ field }) => (
              <Select {...field}>
                <option value="">Select level…</option>
                {SENSITIVITY_LEVELS.map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
            )} />
          </FormField>
        </div>
        <FormField label="Endpoint URL" error={form.formState.errors.endpoint?.message}>
          <Controller name="endpoint" control={form.control} render={({ field }) => <Input {...field} placeholder="https://api.example.com" />} />
        </FormField>
        <FormField label="Allowed Actions" error={form.formState.errors.allowed_actions?.message}>
          <Controller
            name="allowed_actions"
            control={form.control}
            render={({ field }) => (
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {ALLOWED_ACTIONS.map((action) => (
                  <label key={action} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', color: 'var(--color-solar-text-primary)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={field.value.includes(action)}
                      onChange={(e) => {
                        if (e.target.checked) field.onChange([...field.value, action]);
                        else field.onChange(field.value.filter((a: string) => a !== action));
                      }}
                      style={{ accentColor: 'var(--color-solar-accent)' }}
                    />
                    {action}
                  </label>
                ))}
              </div>
            )}
          />
        </FormField>
        <FormField label="Description (optional)">
          <Controller name="description" control={form.control} render={({ field }) => <Input {...field} placeholder="Brief description…" />} />
        </FormField>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
          <Button variant="ghost" onClick={onClose} type="button">Cancel</Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving…' : defaults ? 'Save Changes' : 'Register'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
