'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Button,
  Input,
  FormField,
  useToast,
} from '@solar/ui';
import { createSolarClients, getSolarConfig } from '@solar/api';
import { getSession } from '@solar/auth';
import { Play, GitCompare } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const solar = createSolarClients({
  ...getSolarConfig(),
  getToken: () => getSession()?.token ?? null,
});

const replaySchema = z.object({
  agent_id: z.string().min(1, 'Agent ID required'),
  model_id: z.string().min(1, 'Model ID required'),
  budget_tokens: z.coerce.number().min(100).max(1_000_000),
});

type ReplayForm = z.infer<typeof replaySchema>;

interface ReplayControlProps {
  originalExec: {
    exec_id: string;
    task_id: string;
    agent_id: string;
    model_id: string;
    budget_consumed: number;
  };
  onClose: () => void;
}

export function ReplayControl({ originalExec, onClose }: ReplayControlProps) {
  const toast = useToast();
  const [showDiff, setShowDiff] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ReplayForm>({
    resolver: zodResolver(replaySchema),
    defaultValues: {
      agent_id: originalExec.agent_id,
      model_id: originalExec.model_id,
      budget_tokens: originalExec.budget_consumed > 0 ? originalExec.budget_consumed * 2 : 10000,
    },
  });

  const watchedValues = watch();

  const replayMutation = useMutation({
    mutationFn: async (data: ReplayForm) => {
      return solar.venus.tasks.submit({
        idempotency_key: `replay-${originalExec.exec_id}-${Date.now()}`,
        prompt: `[REPLAY] Re-executing task ${originalExec.task_id}`,
        skills: [],
        tags: {
          replay_of: originalExec.exec_id,
          override_agent: data.agent_id,
          override_model: data.model_id,
        },
        quota_overrides: {
          tokens: { mode: 'hard', limit: data.budget_tokens },
        },
      });
    },
    onSuccess: () => {
      toast.success('Replay submitted', 'New execution has been queued.');
      onClose();
    },
    onError: (err: any) => {
      toast.error('Replay failed', err.message);
    },
  });

  const diffs = [];
  if (watchedValues.agent_id !== originalExec.agent_id) {
    diffs.push({ field: 'agent_id', original: originalExec.agent_id, override: watchedValues.agent_id });
  }
  if (watchedValues.model_id !== originalExec.model_id) {
    diffs.push({ field: 'model_id', original: originalExec.model_id, override: watchedValues.model_id });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Original execution context */}
      <div style={{ background: 'var(--color-solar-surface)', border: '1px solid var(--color-solar-border)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
        <h4 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-solar-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
          Original Execution
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div>
            <span style={{ fontSize: '0.6875rem', color: 'var(--color-solar-text-muted)' }}>Exec ID</span>
            <code style={{ display: 'block', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--color-solar-text-primary)' }}>{originalExec.exec_id.slice(0, 16)}…</code>
          </div>
          <div>
            <span style={{ fontSize: '0.6875rem', color: 'var(--color-solar-text-muted)' }}>Task ID</span>
            <code style={{ display: 'block', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--color-solar-text-primary)' }}>{originalExec.task_id.slice(0, 16)}…</code>
          </div>
          <div>
            <span style={{ fontSize: '0.6875rem', color: 'var(--color-solar-text-muted)' }}>Agent</span>
            <code style={{ display: 'block', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--color-solar-text-secondary)' }}>{originalExec.agent_id}</code>
          </div>
          <div>
            <span style={{ fontSize: '0.6875rem', color: 'var(--color-solar-text-muted)' }}>Model</span>
            <code style={{ display: 'block', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--color-solar-text-secondary)' }}>{originalExec.model_id}</code>
          </div>
        </div>
      </div>

      {/* Replay form */}
      <form onSubmit={handleSubmit((data) => replayMutation.mutate(data))} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ background: 'var(--color-solar-card)', border: '1px solid var(--color-solar-border)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
          <h4 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-solar-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
            Override Parameters
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <FormField label="Agent ID" error={errors.agent_id?.message}>
              <Input
                {...register('agent_id')}
                placeholder="agent-nano-v1"
                style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}
              />
            </FormField>

            <FormField label="Model ID" error={errors.model_id?.message}>
              <Input
                {...register('model_id')}
                placeholder="qwen2.5:7b"
                style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}
              />
            </FormField>

            <FormField label="Budget (tokens)" error={errors.budget_tokens?.message}>
              <Input
                {...register('budget_tokens')}
                type="number"
                placeholder="10000"
                style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}
              />
            </FormField>
          </div>
        </div>

        {/* Diff display */}
        {diffs.length > 0 && (
          <div style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <GitCompare size={14} style={{ color: '#3B82F6' }} />
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#3B82F6' }}>Configuration Diff</span>
            </div>
            {diffs.map((d) => (
              <div key={d.field} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', padding: '0.25rem 0' }}>
                <span style={{ color: 'var(--color-solar-text-muted)' }}>{d.field}:</span>
                <span style={{ color: '#EF4444', textDecoration: 'line-through' }}>{d.original}</span>
                <span style={{ color: 'var(--color-solar-text-muted)' }}>→</span>
                <span style={{ color: '#22C55E' }}>{d.override}</span>
              </div>
            ))}
          </div>
        )}

        <Button type="submit" variant="primary" disabled={replayMutation.isPending}>
          <Play size={14} />
          {replayMutation.isPending ? 'Submitting...' : 'Submit Replay'}
        </Button>
      </form>
    </div>
  );
}
