'use client';

import { Card, Button, Badge, AlertBanner } from '@solar/ui';
import type { CaixaPayload } from '@solar/api';
import { ExternalLink, ShieldAlert } from 'lucide-react';

interface BalanceGateErrorProps {
  payload: CaixaPayload;
}

export function BalanceGateError({ payload }: BalanceGateErrorProps) {
  const isOrphan = payload.error.code === 'ORPHAN_TENANT_NO_RECHARGE';
  const balance = payload.balance.budget_remaining ?? 0;
  const formattedBalance = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: payload.balance.currency,
  }).format(balance);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <AlertBanner
        type="warning"
        title="Balance Gate — Payment Required"
        description={payload.error.message}
      />

      <Card>
        <div
          style={{
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            borderLeft: '3px solid var(--color-solar-warning)',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ShieldAlert size={20} style={{ color: 'var(--color-solar-warning)' }} />
            <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--color-solar-text-primary)' }}>
              Insufficient Balance
            </span>
            <Badge variant="warning">402</Badge>
          </div>

          {/* Balance info */}
          <div
            style={{
              display: 'flex',
              gap: '1.5rem',
              padding: '1rem',
              background: 'rgba(234,179,8,0.06)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(234,179,8,0.15)',
            }}
          >
            <div>
              <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-solar-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Current Balance
              </p>
              <p style={{ margin: '0.25rem 0 0', fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-solar-error)' }}>
                {formattedBalance}
              </p>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-solar-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Currency
              </p>
              <p style={{ margin: '0.25rem 0 0', fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-solar-text-primary)' }}>
                {payload.balance.currency}
              </p>
            </div>
          </div>

          {/* Action area */}
          {isOrphan ? (
            <div
              style={{
                padding: '1rem',
                background: 'rgba(239,68,68,0.06)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(239,68,68,0.15)',
              }}
            >
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-solar-text-primary)', lineHeight: 1.5 }}>
                Your account requires re-authentication. Please contact support.
              </p>
            </div>
          ) : payload.recharge ? (
            <a href={payload.recharge.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
              <Button variant="primary">
                <ExternalLink size={14} /> Recharge Account
              </Button>
            </a>
          ) : null}

          {/* Request ID */}
          <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--color-solar-text-secondary)', fontFamily: 'var(--font-mono)' }}>
            Request ID: {payload.request_id}
          </p>
        </div>
      </Card>
    </div>
  );
}
