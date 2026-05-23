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
  Textarea,
  FormField,
  Checkbox,
  CodeEditor,
  Skeleton,
  Card,
  useToast,
  type ColumnDef,
} from '@solar/ui';
import type { Skill, Agent, PaginatedResponse } from '@solar/api';
import { solar } from '../solarApi';
import { Wrench, Plus, Search, Edit, Trash2 } from 'lucide-react';

// ─── Schema ───────────────────────────────────────────────────────────────────

const skillSchema = z.object({
  skill_id: z.string().min(2).max(64).regex(/^[a-z0-9_.-]+$/, 'Lowercase alphanumeric, dots, dashes, underscores'),
  display_name: z.string().min(2).max(128),
  version: z.string().min(1).regex(/^\d+\.\d+/, 'Semver required'),
  description: z.string().min(10).max(512),
  tool_groups: z.array(z.string()).min(1, 'At least one tool group'),
  compatible_tiers: z.array(z.enum(['nano', 'standard', 'advanced', 'specialized', 'ops_only'])).min(1),
  parameters_schema: z.string().optional(),
});

type SkillFormData = z.infer<typeof skillSchema>;

// ─── Columns ──────────────────────────────────────────────────────────────────

const COLUMNS: ColumnDef<Skill>[] = [
  {
    key: 'display_name',
    header: 'Skill',
    sortable: true,
    cell: (v) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Wrench size={14} style={{ color: 'var(--color-planet-sun)' }} />
        <span style={{ fontWeight: 500, color: 'var(--color-solar-text-primary)' }}>{String(v)}</span>
      </div>
    ),
  },
  {
    key: 'skill_id',
    header: 'ID',
    cell: (v) => <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-solar-text-secondary)' }}>{String(v)}</span>,
  },
  {
    key: 'version',
    header: 'Version',
    cell: (v) => <Badge variant="default">v{String(v)}</Badge>,
  },
  {
    key: 'description',
    header: 'Description',
    cell: (v) => <span style={{ fontSize: '0.8125rem', color: 'var(--color-solar-text-secondary)', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{String(v)}</span>,
  },
  {
    key: 'tool_groups',
    header: 'Tool Groups',
    cell: (v) => {
      const groups = v as string[];
      return (
        <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
          {groups.slice(0, 3).map(g => (
            <span key={g} style={{ background: 'var(--color-solar-surface)', border: '1px solid var(--color-solar-border)', borderRadius: '4px', padding: '0.125rem 0.375rem', fontSize: '0.6875rem' }}>{g}</span>
          ))}
          {groups.length > 3 && <span style={{ fontSize: '0.6875rem', color: 'var(--color-solar-text-secondary)' }}>+{groups.length - 3}</span>}
        </div>
      );
    },
  },
  {
    key: 'compatible_tiers',
    header: 'Compatible Tiers',
    cell: (v) => {
      const tiers = v as string[];
      return (
        <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
          {tiers.map(t => <Badge key={t} variant="info">{t}</Badge>)}
        </div>
      );
    },
  },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export function SkillCatalog() {
  const [showRegister, setShowRegister] = useState(false);
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: skills, isLoading } = useQuery<Skill[]>({
    queryKey: ['skills', 'list'],
    queryFn: () => solar.sun.skills.list(),
    refetchInterval: 60_000,
  });

  const { data: agentsData } = useQuery<PaginatedResponse<Agent>>({
    queryKey: ['skills', 'agents'],
    queryFn: () => solar.sun.agents.list({ page: 1, page_size: 100 }),
  });

  const registerMutation = useMutation({
    mutationFn: (data: Partial<Skill>) => solar.sun.skills.register(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      toast({ title: 'Skill registered', type: 'success' });
      setShowRegister(false);
    },
    onError: (err: any) => toast({ title: 'Failed to register', description: err?.message, type: 'error' }),
  });

  const allSkills = skills ?? [];
  const filtered = search ? allSkills.filter(s => s.display_name.toLowerCase().includes(search.toLowerCase()) || s.skill_id.includes(search.toLowerCase())) : allSkills;

  // Build agent usage map
  const agentUsage: Record<string, string[]> = {};
  (agentsData?.items ?? []).forEach(agent => {
    agent.skills.forEach(skillId => {
      if (!agentUsage[skillId]) agentUsage[skillId] = [];
      agentUsage[skillId].push(agent.display_name);
    });
  });

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <PageHeader
        title="Skill Catalog"
        description="Define and manage skills, tool groups, and capability mappings for agents."
        actions={
          <Button variant="primary" size="sm" onClick={() => setShowRegister(true)}>
            <Plus size={14} /> Register Skill
          </Button>
        }
      />

      {/* Search */}
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1', maxWidth: '400px' }}>
          <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-solar-text-secondary)' }} />
          <Input placeholder="Search skills..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: '2rem' }} />
        </div>
        <span style={{ fontSize: '0.8125rem', color: 'var(--color-solar-text-secondary)' }}>
          {filtered.length} skill{filtered.length !== 1 ? 's' : ''} registered
        </span>
      </div>

      {/* Grid view */}
      {isLoading ? (
        <Skeleton lines={8} height="40px" />
      ) : filtered.length === 0 ? (
        <Card>
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-solar-text-secondary)' }}>
            No skills registered yet. Create your first skill to get started.
          </div>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1rem' }}>
          {filtered.map(skill => (
            <div key={skill.skill_id} style={{ background: 'var(--color-solar-card)', border: '1px solid var(--color-solar-border)', borderRadius: 'var(--radius-lg)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Wrench size={16} style={{ color: 'var(--color-planet-sun)' }} />
                  <span style={{ fontWeight: 600, color: 'var(--color-solar-text-primary)' }}>{skill.display_name}</span>
                </div>
                <Badge variant="default">v{skill.version}</Badge>
              </div>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--color-solar-text-secondary)', lineHeight: 1.4 }}>{skill.description}</p>
              <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                {skill.tool_groups.map(g => (
                  <span key={g} style={{ background: 'var(--color-solar-surface)', border: '1px solid var(--color-solar-border)', borderRadius: '4px', padding: '0.125rem 0.5rem', fontSize: '0.6875rem', color: 'var(--color-solar-text-secondary)' }}>{g}</span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                {skill.compatible_tiers.map(t => <Badge key={t} variant="info">{t}</Badge>)}
              </div>
              {agentUsage[skill.skill_id] && (
                <div style={{ borderTop: '1px solid var(--color-solar-border)', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--color-solar-text-secondary)' }}>
                    Used by: {agentUsage[skill.skill_id].slice(0, 3).join(', ')}{agentUsage[skill.skill_id].length > 3 ? ` +${agentUsage[skill.skill_id].length - 3} more` : ''}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Register Modal */}
      {showRegister && (
        <RegisterSkillModal
          open={showRegister}
          onClose={() => setShowRegister(false)}
          onSubmit={(data) => registerMutation.mutate(data)}
          isLoading={registerMutation.isPending}
        />
      )}
    </div>
  );
}

// ─── Register Skill Modal ─────────────────────────────────────────────────────

function RegisterSkillModal({ open, onClose, onSubmit, isLoading }: { open: boolean; onClose: () => void; onSubmit: (d: Partial<Skill>) => void; isLoading: boolean }) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<SkillFormData>({
    resolver: zodResolver(skillSchema),
    defaultValues: { tool_groups: [], compatible_tiers: ['standard'], parameters_schema: '{}' },
  });

  const [toolInput, setToolInput] = useState('');
  const currentTools = watch('tool_groups');
  const currentTiers = watch('compatible_tiers');

  const submit = handleSubmit((data) => {
    let schema: Record<string, unknown> | undefined;
    try { schema = data.parameters_schema ? JSON.parse(data.parameters_schema) : undefined; } catch { schema = undefined; }
    onSubmit({
      skill_id: data.skill_id,
      display_name: data.display_name,
      version: data.version,
      description: data.description,
      tool_groups: data.tool_groups,
      compatible_tiers: data.compatible_tiers,
      parameters_schema: schema,
    });
  });

  return (
    <Modal title="Register Skill" open={open} onClose={onClose} size="lg">
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <FormField label="Skill ID" error={errors.skill_id?.message}>
            <Input {...register('skill_id')} placeholder="code.review" />
          </FormField>
          <FormField label="Display Name" error={errors.display_name?.message}>
            <Input {...register('display_name')} placeholder="Code Review" />
          </FormField>
          <FormField label="Version" error={errors.version?.message}>
            <Input {...register('version')} placeholder="1.0.0" />
          </FormField>
        </div>

        <FormField label="Description" error={errors.description?.message}>
          <Textarea {...register('description')} placeholder="What this skill enables agents to do..." rows={2} />
        </FormField>

        <FormField label="Tool Groups" error={errors.tool_groups?.message}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Input value={toolInput} onChange={(e) => setToolInput(e.target.value)} placeholder="Add tool group..." onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (toolInput.trim()) { setValue('tool_groups', [...currentTools, toolInput.trim()]); setToolInput(''); } } }} />
            <Button type="button" variant="secondary" size="sm" onClick={() => { if (toolInput.trim()) { setValue('tool_groups', [...currentTools, toolInput.trim()]); setToolInput(''); } }}>Add</Button>
          </div>
          <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
            {currentTools.map((g, i) => (
              <Badge key={i} variant="info" onClick={() => setValue('tool_groups', currentTools.filter((_, j) => j !== i))} style={{ cursor: 'pointer' }}>{g} ×</Badge>
            ))}
          </div>
        </FormField>

        <FormField label="Compatible Tiers" error={errors.compatible_tiers?.message}>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {(['nano', 'standard', 'advanced', 'specialized', 'ops_only'] as const).map(tier => (
              <label key={tier} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={currentTiers.includes(tier)}
                  onChange={(e) => {
                    if (e.target.checked) setValue('compatible_tiers', [...currentTiers, tier]);
                    else setValue('compatible_tiers', currentTiers.filter(t => t !== tier));
                  }}
                />
                {tier}
              </label>
            ))}
          </div>
        </FormField>

        <FormField label="Parameters Schema (JSON)">
          <CodeEditor value={watch('parameters_schema') || '{}'} onChange={(v) => setValue('parameters_schema', v)} language="json" height="120px" />
        </FormField>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={isLoading}>{isLoading ? 'Registering...' : 'Register Skill'}</Button>
        </div>
      </form>
    </Modal>
  );
}
