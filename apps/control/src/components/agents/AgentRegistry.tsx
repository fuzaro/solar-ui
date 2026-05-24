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
  MultiSelect,
  Textarea,
  FormField,
  StatusDot,
  Skeleton,
  useToast,
  type ColumnDef,
} from '@solar/ui';
import type { Agent, PaginatedResponse, RegisterAgentRequest } from '@solar/api';
import { solar } from '../solarApi';
import { Providers } from '../Providers';
import { Bot, Plus, Search, Filter } from 'lucide-react';

// ─── Validation Schema ────────────────────────────────────────────────────────

const registerSchema = z.object({
  agent_id: z.string().min(3).max(64).regex(/^[a-z0-9_-]+$/, 'Lowercase alphanumeric, dashes, underscores only'),
  display_name: z.string().min(2).max(128),
  description: z.string().max(512).optional(),
  tier: z.enum(['nano', 'standard', 'advanced', 'specialized', 'ops_only']),
  version: z.string().min(1).regex(/^\d+\.\d+\.\d+/, 'Must be semver (e.g. 1.0.0)'),
  image_ref: z.string().min(1),
  skills: z.array(z.string()).min(1, 'At least one skill required'),
  privilege_mode: z.enum(['supervised', 'managed', 'autonomous']),
  lifecycle_types: z.array(z.enum(['run_once', 'batch', 'scheduled', 'long_running', 'reactive'])).min(1),
  side_effects: z.array(z.string()).optional(),
});

type RegisterFormData = z.infer<typeof registerSchema>;

// ─── Columns ──────────────────────────────────────────────────────────────────

const COLUMNS: ColumnDef<Agent>[] = [
  {
    key: 'display_name',
    header: 'Agent',
    sortable: true,
    cell: (v, row) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Bot size={14} style={{ color: 'var(--color-planet-mars)' }} />
        <a href={`/agents?detail=${(row as Agent).agent_id}`} style={{ color: 'var(--color-solar-text-primary)', fontWeight: 500, textDecoration: 'none' }}>
          {String(v)}
        </a>
      </div>
    ),
  },
  {
    key: 'agent_id',
    header: 'ID',
    cell: (v) => <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-solar-text-secondary)' }}>{String(v)}</span>,
  },
  {
    key: 'tier',
    header: 'Tier',
    sortable: true,
    cell: (v) => {
      const colors: Record<string, string> = { nano: 'default', standard: 'info', advanced: 'success', specialized: 'warning', ops_only: 'error' };
      return <Badge variant={(colors[String(v)] || 'default') as any}>{String(v)}</Badge>;
    },
  },
  {
    key: 'trust_tier',
    header: 'Trust',
    cell: (v) => {
      const variant = v === 'system' ? 'success' : v === 'trusted' ? 'info' : v === 'standard' ? 'default' : 'warning';
      return <Badge variant={variant}>{String(v)}</Badge>;
    },
  },
  {
    key: 'status',
    header: 'Status',
    sortable: true,
    cell: (v) => {
      const s = String(v) as Agent['status'];
      return <StatusDot status={s === 'active' ? 'healthy' : s === 'canary' ? 'degraded' : 'unreachable'} label={s} />;
    },
  },
  {
    key: 'skills',
    header: 'Skills',
    cell: (v) => {
      const skills = v as string[];
      return (
        <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
          {skills.slice(0, 3).map(s => (
            <span key={s} style={{ background: 'var(--color-solar-surface)', border: '1px solid var(--color-solar-border)', borderRadius: '4px', padding: '0.125rem 0.375rem', fontSize: '0.6875rem', color: 'var(--color-solar-text-secondary)' }}>{s}</span>
          ))}
          {skills.length > 3 && <span style={{ fontSize: '0.6875rem', color: 'var(--color-solar-text-secondary)' }}>+{skills.length - 3}</span>}
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
    key: 'version',
    header: 'Version',
    cell: (v) => <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-solar-text-secondary)' }}>{String(v)}</span>,
  },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export function AgentRegistry() {
  return (
    <Providers>
      <AgentRegistryContent />
    </Providers>
  );
}

function AgentRegistryContent() {
  const [showRegister, setShowRegister] = useState(false);
  const [filterTier, setFilterTier] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useQuery<PaginatedResponse<Agent>>({
    queryKey: ['agents', 'list', page, filterTier, filterStatus],
    queryFn: () => solar.sun.agents.list({
      page,
      page_size: 20,
      ...(filterTier && { tier: filterTier }),
      ...(filterStatus && { status: filterStatus }),
    }),
    refetchInterval: 30_000,
  });

  const registerMutation = useMutation({
    mutationFn: (data: RegisterAgentRequest) => solar.sun.agents.register(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      toast({ title: 'Agent registered', description: 'New agent was successfully registered.', type: 'success' });
      setShowRegister(false);
    },
    onError: (err: any) => {
      toast({ title: 'Registration failed', description: err?.message || 'Check inputs and try again.', type: 'error' });
    },
  });

  const agents = data?.items ?? [];
  const filtered = search ? agents.filter(a => a.display_name.toLowerCase().includes(search.toLowerCase()) || a.agent_id.includes(search.toLowerCase())) : agents;

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <PageHeader
        title="Agent Registry"
        description="Register, configure, and manage AI agents across all tiers."
        actions={
          <Button variant="primary" size="sm" onClick={() => setShowRegister(true)}>
            <Plus size={14} /> Register Agent
          </Button>
        }
      />

      {/* ── Filters ── */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1', maxWidth: '320px' }}>
          <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-solar-text-secondary)' }} />
          <Input placeholder="Search agents..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: '2rem' }} />
        </div>
        <Select value={filterTier} onChange={(e) => { setFilterTier(e.target.value); setPage(1); }}>
          <option value="">All Tiers</option>
          <option value="nano">Nano</option>
          <option value="standard">Standard</option>
          <option value="advanced">Advanced</option>
          <option value="specialized">Specialized</option>
          <option value="ops_only">Ops Only</option>
        </Select>
        <Select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}>
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="canary">Canary</option>
          <option value="deprecated">Deprecated</option>
          <option value="retired">Retired</option>
        </Select>
      </div>

      {/* ── Table ── */}
      {isLoading ? (
        <Skeleton lines={10} height="40px" />
      ) : (
        <DataTable<Agent>
          columns={COLUMNS}
          data={filtered}
          emptyMessage="No agents found matching your criteria."
          pagination={data ? { page: data.page, pageSize: data.page_size, total: data.total, onPageChange: setPage } : undefined}
        />
      )}

      {/* ── Register Modal ── */}
      <RegisterAgentModal
        open={showRegister}
        onClose={() => setShowRegister(false)}
        onSubmit={(data) => registerMutation.mutate(data)}
        isLoading={registerMutation.isPending}
      />
    </div>
  );
}

// ─── Register Agent Modal ─────────────────────────────────────────────────────

function RegisterAgentModal({ open, onClose, onSubmit, isLoading }: { open: boolean; onClose: () => void; onSubmit: (d: RegisterAgentRequest) => void; isLoading: boolean }) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { tier: 'standard', privilege_mode: 'supervised', lifecycle_types: ['run_once'], skills: [], side_effects: [] },
  });

  const [sideEffectInput, setSideEffectInput] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const currentSkills = watch('skills');
  const currentSideEffects = watch('side_effects') ?? [];

  const submit = handleSubmit((data) => {
    onSubmit({
      agent_id: data.agent_id,
      display_name: data.display_name,
      tier: data.tier,
      version: data.version,
      image_ref: data.image_ref,
      skills: data.skills,
      privilege_mode: data.privilege_mode,
      lifecycle_types: data.lifecycle_types,
      side_effects: data.side_effects,
      description: data.description,
    });
  });

  if (!open) return null;

  return (
    <Modal title="Register New Agent" open={open} onClose={onClose} size="lg">
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <FormField label="Agent ID" error={errors.agent_id?.message}>
            <Input {...register('agent_id')} placeholder="my-agent-v1" />
          </FormField>
          <FormField label="Display Name" error={errors.display_name?.message}>
            <Input {...register('display_name')} placeholder="My Agent" />
          </FormField>
        </div>

        <FormField label="Description" error={errors.description?.message}>
          <Textarea {...register('description')} placeholder="What does this agent do?" rows={2} />
        </FormField>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <FormField label="Tier" error={errors.tier?.message}>
            <Select {...register('tier')}>
              <option value="nano">Nano</option>
              <option value="standard">Standard</option>
              <option value="advanced">Advanced</option>
              <option value="specialized">Specialized</option>
              <option value="ops_only">Ops Only</option>
            </Select>
          </FormField>
          <FormField label="Version" error={errors.version?.message}>
            <Input {...register('version')} placeholder="1.0.0" />
          </FormField>
          <FormField label="Privilege Mode" error={errors.privilege_mode?.message}>
            <Select {...register('privilege_mode')}>
              <option value="supervised">Supervised</option>
              <option value="managed">Managed</option>
              <option value="autonomous">Autonomous</option>
            </Select>
          </FormField>
        </div>

        <FormField label="Docker Image" error={errors.image_ref?.message}>
          <Input {...register('image_ref')} placeholder="registry.solar.ai/agents/my-agent:1.0.0" />
        </FormField>

        <FormField label="Skills" error={errors.skills?.message}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Input value={skillInput} onChange={(e) => setSkillInput(e.target.value)} placeholder="Add skill ID..." onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (skillInput.trim()) { setValue('skills', [...currentSkills, skillInput.trim()]); setSkillInput(''); } } }} />
            <Button type="button" variant="secondary" size="sm" onClick={() => { if (skillInput.trim()) { setValue('skills', [...currentSkills, skillInput.trim()]); setSkillInput(''); } }}>Add</Button>
          </div>
          <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
            {currentSkills.map((s, i) => (
              <Badge key={i} variant="info" onClick={() => setValue('skills', currentSkills.filter((_, j) => j !== i))} style={{ cursor: 'pointer' }}>{s} ×</Badge>
            ))}
          </div>
        </FormField>

        <FormField label="Lifecycle Types" error={errors.lifecycle_types?.message}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {(['run_once', 'batch', 'scheduled', 'long_running', 'reactive'] as const).map(lt => {
              const selected = watch('lifecycle_types').includes(lt);
              return (
                <Button key={lt} type="button" variant={selected ? 'primary' : 'ghost'} size="sm" onClick={() => {
                  const current = watch('lifecycle_types');
                  setValue('lifecycle_types', selected ? current.filter(x => x !== lt) : [...current, lt]);
                }}>{lt.replace('_', ' ')}</Button>
              );
            })}
          </div>
        </FormField>

        <FormField label="Side Effects (optional)">
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Input value={sideEffectInput} onChange={(e) => setSideEffectInput(e.target.value)} placeholder="e.g. sends_email" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (sideEffectInput.trim()) { setValue('side_effects', [...currentSideEffects, sideEffectInput.trim()]); setSideEffectInput(''); } } }} />
            <Button type="button" variant="secondary" size="sm" onClick={() => { if (sideEffectInput.trim()) { setValue('side_effects', [...currentSideEffects, sideEffectInput.trim()]); setSideEffectInput(''); } }}>Add</Button>
          </div>
          <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
            {currentSideEffects.map((s, i) => (
              <Badge key={i} variant="default" onClick={() => setValue('side_effects', currentSideEffects.filter((_, j) => j !== i))} style={{ cursor: 'pointer' }}>{s} ×</Badge>
            ))}
          </div>
        </FormField>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={isLoading}>{isLoading ? 'Registering...' : 'Register Agent'}</Button>
        </div>
      </form>
    </Modal>
  );
}
