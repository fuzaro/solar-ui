'use client';

import { useState } from 'react';
import {
  PageHeader,
  Badge,
  Button,
  Input,
  Card,
  ConfirmDialog,
  useToast,
} from '@solar/ui';
import { createSolarClients, type ReconcileOrphanRequest, type ReconcileOrphanResponse } from '@solar/api';
import { ArrowRight, CheckCircle, AlertTriangle, RotateCcw, DollarSign } from 'lucide-react';

// ─── Solar clients ────────────────────────────────────────────────────────────

const solar = createSolarClients({
  venus: import.meta.env.PUBLIC_VENUS_URL || 'http://localhost:8000',
  neptune: import.meta.env.PUBLIC_NEPTUNE_URL || 'http://localhost:8001',
  mars: import.meta.env.PUBLIC_MARS_URL || 'http://localhost:8002',
  moon: import.meta.env.PUBLIC_MOON_URL || 'http://localhost:8003',
  saturn: import.meta.env.PUBLIC_SATURN_URL || 'http://localhost:8006',
  sun: import.meta.env.PUBLIC_SUN_URL || 'http://localhost:8007',
  pluto: import.meta.env.PUBLIC_PLUTO_URL || 'http://localhost:8008',
  themis: import.meta.env.PUBLIC_THEMIS_URL || 'http://localhost:8009',
});

// ─── Types ───────────────────────────────────────────────────────────────────

type Step = 'form' | 'review' | 'result';

interface FormState {
  original_tenant_id: string;
  target_tenant_id: string;
  since_ts: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function OrphanReconciliation() {
  const toast = useToast();
  const [step, setStep] = useState<Step>('form');
  const [form, setForm] = useState<FormState>({
    original_tenant_id: '',
    target_tenant_id: '',
    since_ts: '',
  });
  const [loading, setLoading] = useState(false);
  const [dryRunResult, setDryRunResult] = useState<ReconcileOrphanResponse | null>(null);
  const [confirmResult, setConfirmResult] = useState<ReconcileOrphanResponse | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setStep('form');
    setForm({ original_tenant_id: '', target_tenant_id: '', since_ts: '' });
    setDryRunResult(null);
    setConfirmResult(null);
    setError(null);
  };

  const buildRequest = (dryRun: boolean): ReconcileOrphanRequest => ({
    original_tenant_id: form.original_tenant_id.trim(),
    target_tenant_id: form.target_tenant_id.trim(),
    ...(form.since_ts ? { since_ts: form.since_ts.trim() } : {}),
    dry_run: dryRun,
  });

  const handleDryRun = async () => {
    if (!form.original_tenant_id.trim() || !form.target_tenant_id.trim()) {
      setError('Both Original Tenant ID and Target Tenant ID are required.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const result = await solar.saturn.admin.reconcileOrphan(buildRequest(true));
      setDryRunResult(result);
      setStep('review');
    } catch (err: any) {
      const msg = err?.message || 'Failed to preview reconciliation.';
      setError(msg);
      toast.error('Dry Run Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    setShowConfirm(false);
    setLoading(true);
    try {
      const result = await solar.saturn.admin.reconcileOrphan(buildRequest(false));
      setConfirmResult(result);
      setStep('result');
      toast.success('Reconciliation Complete', `Ref: ${result.reconciliation_ref}`);
    } catch (err: any) {
      const msg = err?.message || 'Reconciliation failed.';
      setError(msg);
      toast.error('Reconciliation Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const formatUSD = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <PageHeader
        title="Orphan Debit Reconciliation"
        description="Reassign stranded debits from the system_orphan tenant to their correct tenant."
        badge={step === 'review' ? 'Preview' : step === 'result' ? 'Complete' : undefined}
      />

      {/* Error banner */}
      {error && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <AlertTriangle size={16} style={{ color: '#EF4444' }} />
          <span style={{ fontSize: '0.8125rem', color: '#EF4444' }}>{error}</span>
        </div>
      )}

      {/* Step 1: Form */}
      {step === 'form' && (
        <Card>
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-solar-text-primary)', margin: 0 }}>
              Step 1 — Configure Reconciliation
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.6875rem', color: 'var(--color-solar-text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                  Original Tenant ID (orphan source)
                </label>
                <Input
                  value={form.original_tenant_id}
                  onChange={(e) => setForm({ ...form, original_tenant_id: e.target.value })}
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.6875rem', color: 'var(--color-solar-text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                  Target Tenant ID (real tenant)
                </label>
                <Input
                  value={form.target_tenant_id}
                  onChange={(e) => setForm({ ...form, target_tenant_id: e.target.value })}
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}
                />
              </div>
            </div>

            <div style={{ maxWidth: '20rem' }}>
              <label style={{ fontSize: '0.6875rem', color: 'var(--color-solar-text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                Since Timestamp (optional, ISO 8601)
              </label>
              <Input
                value={form.since_ts}
                onChange={(e) => setForm({ ...form, since_ts: e.target.value })}
                placeholder="2026-01-01T00:00:00Z"
                style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input type="checkbox" checked disabled style={{ accentColor: 'var(--color-solar-accent)' }} />
              <label style={{ fontSize: '0.75rem', color: 'var(--color-solar-text-muted)' }}>Dry Run (preview only)</label>
            </div>

            <div style={{ paddingTop: '0.5rem' }}>
              <Button variant="primary" size="sm" onClick={handleDryRun} loading={loading}>
                <ArrowRight size={14} /> Preview Reconciliation
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Step 2: Review */}
      {step === 'review' && dryRunResult && (
        <Card>
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-solar-text-primary)', margin: 0 }}>
              Step 2 — Review Dry Run Results
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div style={{ background: 'var(--color-solar-surface)', border: '1px solid var(--color-solar-border)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                <span style={{ fontSize: '0.6875rem', color: 'var(--color-solar-text-muted)', display: 'block', marginBottom: '0.25rem' }}>Matched Debits</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-solar-text-primary)' }}>{dryRunResult.matched_debits}</span>
              </div>
              <div style={{ background: 'var(--color-solar-surface)', border: '1px solid var(--color-solar-border)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                <span style={{ fontSize: '0.6875rem', color: 'var(--color-solar-text-muted)', display: 'block', marginBottom: '0.25rem' }}>Total Amount</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-solar-text-primary)' }}>
                  <DollarSign size={14} style={{ display: 'inline', verticalAlign: 'middle' }} />
                  {formatUSD(dryRunResult.total_amount_usd).replace('$', '')}
                </span>
              </div>
              <div style={{ background: 'var(--color-solar-surface)', border: '1px solid var(--color-solar-border)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                <span style={{ fontSize: '0.6875rem', color: 'var(--color-solar-text-muted)', display: 'block', marginBottom: '0.25rem' }}>Mode</span>
                <Badge variant="default">DRY RUN</Badge>
              </div>
            </div>

            {/* Ledger IDs */}
            {dryRunResult.ledger_ids.length > 0 && (
              <div>
                <label style={{ fontSize: '0.6875rem', color: 'var(--color-solar-text-muted)', display: 'block', marginBottom: '0.375rem' }}>
                  Ledger IDs ({dryRunResult.ledger_ids.length})
                </label>
                <div style={{
                  background: 'var(--color-solar-surface)',
                  border: '1px solid var(--color-solar-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.75rem',
                  maxHeight: '12rem',
                  overflowY: 'auto',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.6875rem',
                  lineHeight: '1.6',
                  color: 'var(--color-solar-text-secondary)',
                }}>
                  {dryRunResult.ledger_ids.map((id) => (
                    <div key={id}>{id}</div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.5rem' }}>
              <Button variant="secondary" size="sm" onClick={reset}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={() => setShowConfirm(true)} loading={loading}>
                <CheckCircle size={14} /> Confirm Reconciliation
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Step 3: Result */}
      {step === 'result' && confirmResult && (
        <Card>
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <CheckCircle size={20} style={{ color: '#22C55E' }} />
              <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#22C55E', margin: 0 }}>
                Reconciliation Successful
              </h3>
            </div>

            <div style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 'var(--radius-md)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-solar-text-muted)' }}>Reconciliation Ref</span>
                <code style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--color-solar-text-primary)' }}>{confirmResult.reconciliation_ref}</code>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-solar-text-muted)' }}>Debits Moved</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-solar-text-primary)' }}>{confirmResult.matched_debits}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-solar-text-muted)' }}>Total Amount</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-solar-text-primary)' }}>{formatUSD(confirmResult.total_amount_usd)}</span>
              </div>
            </div>

            <div style={{ paddingTop: '0.5rem' }}>
              <Button variant="secondary" size="sm" onClick={reset}>
                <RotateCcw size={14} /> Done
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Confirmation dialog */}
      <ConfirmDialog
        open={showConfirm}
        onConfirm={handleConfirm}
        onCancel={() => setShowConfirm(false)}
        title="Confirm Orphan Reconciliation"
        description={`This will permanently move ${dryRunResult?.matched_debits ?? 0} debits (${formatUSD(dryRunResult?.total_amount_usd ?? 0)}) from the orphan tenant to the target tenant. This action cannot be undone.`}
        confirmLabel="Reconcile Now"
        cancelLabel="Go Back"
        variant="danger"
        loading={loading}
      />
    </div>
  );
}
