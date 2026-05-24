'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Badge,
  LoadingSpinner,
  EXECUTION_STEPS,
} from '@solar/ui';
import { createSolarClients, getSolarConfig } from '@solar/api';
import { getSession } from '@solar/auth';
import { Clock, CheckCircle, XCircle, Loader } from 'lucide-react';
import { useState } from 'react';

const solar = createSolarClients({
  ...getSolarConfig(),
  getToken: () => getSession()?.token ?? null,
});

interface StepLedgerProps {
  execId: string;
  taskId: string;
}

interface StepRecord {
  step_id: number;
  name: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
  started_at: string | null;
  completed_at: string | null;
  duration_ms: number;
  attempts: number;
  error?: string;
  token?: string;
  events?: Array<{ type: string; timestamp: string; detail: string }>;
}

export function StepLedger({ execId, taskId }: StepLedgerProps) {
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  const { data: steps, isLoading } = useQuery({
    queryKey: ['step-ledger', taskId],
    queryFn: async () => {
      const resp = await solar.moon.steps.list(taskId);
      if (Array.isArray(resp) && resp.length > 0) {
        return resp.map((s: any, i: number) => ({
          step_id: s.step_id ?? i + 1,
          name: s.name ?? EXECUTION_STEPS[i]?.name ?? `Step ${i + 1}`,
          status: s.status ?? 'pending',
          started_at: s.started_at ?? null,
          completed_at: s.completed_at ?? null,
          duration_ms: s.duration_ms ?? 0,
          attempts: s.attempts ?? 1,
          error: s.error,
          token: s.token ?? s.step_token,
          events: s.events ?? [],
        })) as StepRecord[];
      }
      // Fallback: generate from EXECUTION_STEPS template
      return EXECUTION_STEPS.map((s, i) => ({
        step_id: s.id,
        name: s.name,
        status: 'pending' as const,
        started_at: null,
        completed_at: null,
        duration_ms: 0,
        attempts: 0,
        events: [],
      })) as StepRecord[];
    },
  });

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
        <LoadingSpinner />
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle size={14} style={{ color: '#22C55E' }} />;
      case 'failed': return <XCircle size={14} style={{ color: '#EF4444' }} />;
      case 'running': return <Loader size={14} style={{ color: '#3B82F6' }} className="animate-spin" />;
      default: return <Clock size={14} style={{ color: '#6B7280' }} />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Execution context */}
      <div style={{ background: 'var(--color-solar-surface)', border: '1px solid var(--color-solar-border)', borderRadius: 'var(--radius-md)', padding: '0.75rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
          <div>
            <span style={{ fontSize: '0.6875rem', color: 'var(--color-solar-text-muted)' }}>Exec ID</span>
            <code style={{ display: 'block', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--color-solar-text-primary)' }}>{execId}</code>
          </div>
          <div>
            <span style={{ fontSize: '0.6875rem', color: 'var(--color-solar-text-muted)' }}>Task ID</span>
            <code style={{ display: 'block', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--color-solar-text-primary)' }}>{taskId}</code>
          </div>
        </div>
      </div>

      {/* Step timeline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {(steps || []).map((step, idx) => (
          <div key={step.step_id}>
            <button
              onClick={() => setExpandedStep(expandedStep === idx ? null : idx)}
              style={{
                width: '100%',
                background: expandedStep === idx ? 'var(--color-solar-surface)' : 'var(--color-solar-card)',
                border: '1px solid var(--color-solar-border)',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem 1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                transition: 'background 0.15s',
                textAlign: 'left',
              }}
            >
              {/* Step number */}
              <div style={{
                width: '1.5rem',
                height: '1.5rem',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.6875rem',
                fontWeight: 600,
                fontFamily: 'var(--font-mono)',
                background: step.status === 'success' ? 'rgba(34,197,94,0.15)' : step.status === 'failed' ? 'rgba(239,68,68,0.15)' : step.status === 'running' ? 'rgba(59,130,246,0.15)' : 'rgba(107,114,128,0.1)',
                color: step.status === 'success' ? '#22C55E' : step.status === 'failed' ? '#EF4444' : step.status === 'running' ? '#3B82F6' : '#6B7280',
              }}>
                {step.step_id}
              </div>

              {/* Name */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-solar-text-primary)', fontFamily: 'var(--font-mono)' }}>
                  {step.name}
                </div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--color-solar-text-muted)' }}>
                  {EXECUTION_STEPS[idx]?.description ?? ''}
                </div>
              </div>

              {/* Status */}
              {getStatusIcon(step.status)}
              <Badge variant={step.status === 'success' ? 'success' : step.status === 'failed' ? 'error' : step.status === 'running' ? 'info' : 'neutral'}>
                {step.status}
              </Badge>

              {/* Duration */}
              {step.duration_ms > 0 && (
                <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--color-solar-text-muted)' }}>
                  {step.duration_ms}ms
                </span>
              )}

              {/* Attempts */}
              {step.attempts > 1 && (
                <Badge variant="warning">{step.attempts}x</Badge>
              )}
            </button>

            {/* Expanded detail */}
            {expandedStep === idx && (
              <div style={{
                marginLeft: '1.5rem',
                borderLeft: '2px solid var(--color-solar-border)',
                paddingLeft: '1rem',
                paddingTop: '0.75rem',
                paddingBottom: '0.75rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
              }}>
                {step.token && (
                  <div>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--color-solar-text-muted)' }}>Step Token</span>
                    <code style={{ display: 'block', fontSize: '0.6875rem', fontFamily: 'var(--font-mono)', color: 'var(--color-solar-text-secondary)' }}>{step.token}</code>
                  </div>
                )}
                {step.started_at && (
                  <div>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--color-solar-text-muted)' }}>Started</span>
                    <code style={{ display: 'block', fontSize: '0.6875rem', fontFamily: 'var(--font-mono)', color: 'var(--color-solar-text-secondary)' }}>{step.started_at}</code>
                  </div>
                )}
                {step.duration_ms > 0 && (
                  <div>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--color-solar-text-muted)' }}>Duration</span>
                    <code style={{ display: 'block', fontSize: '0.6875rem', fontFamily: 'var(--font-mono)', color: 'var(--color-solar-text-secondary)' }}>{step.duration_ms}ms</code>
                  </div>
                )}
                {step.error && (
                  <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-sm)', padding: '0.5rem' }}>
                    <span style={{ fontSize: '0.6875rem', color: '#EF4444', fontWeight: 500 }}>Error</span>
                    <pre style={{ fontSize: '0.6875rem', fontFamily: 'var(--font-mono)', color: '#EF4444', margin: '0.25rem 0 0', whiteSpace: 'pre-wrap' }}>{step.error}</pre>
                  </div>
                )}
                {step.events && step.events.length > 0 && (
                  <div>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--color-solar-text-muted)', fontWeight: 500 }}>Events</span>
                    {step.events.map((evt, i) => (
                      <div key={i} style={{ display: 'flex', gap: '0.5rem', padding: '0.25rem 0', fontSize: '0.6875rem' }}>
                        <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-solar-text-muted)' }}>{evt.timestamp}</code>
                        <Badge variant="default">{evt.type}</Badge>
                        <span style={{ color: 'var(--color-solar-text-secondary)' }}>{evt.detail}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
