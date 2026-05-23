'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  PageHeader,
  DataTable,
  Badge,
  Button,
  Card,
  StatsCard,
  QuotaBar,
  Modal,
  Skeleton,
  AlertBanner,
  useToast,
  type ColumnDef,
} from '@solar/ui';
import type { BudgetLedgerEntry, PaginatedResponse } from '@solar/api';
import { useSolar } from '../useSolar';
import { useAuth } from '@solar/auth';
import { CreditCard, TrendingUp, TrendingDown, DollarSign, Zap } from 'lucide-react';

function generateUsageData(): { day: string; amount: number }[] {
  const data: { day: string; amount: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    data.push({
      day: date.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      amount: Math.random() * 2 + 0.1,
    });
  }
  return data;
}

function UsageChart({ data }: { data: { day: string; amount: number }[] }) {
  const maxAmount = Math.max(...data.map((d) => d.amount));
  const chartHeight = 120;
  const barWidth = 100 / data.length;

  return (
    <div style={{ width: '100%', overflow: 'hidden' }}>
      <svg width="100%" height={chartHeight + 30} viewBox={`0 0 ${data.length * 20} ${chartHeight + 30}`} preserveAspectRatio="none">
        {data.map((d, i) => {
          const barHeight = (d.amount / maxAmount) * chartHeight;
          return (
            <g key={i}>
              <rect
                x={i * 20 + 2}
                y={chartHeight - barHeight}
                width={16}
                height={barHeight}
                rx={2}
                fill="var(--color-solar-accent)"
                opacity={0.7 + (i / data.length) * 0.3}
              />
              {i % 7 === 0 && (
                <text
                  x={i * 20 + 10}
                  y={chartHeight + 16}
                  textAnchor="middle"
                  fill="var(--color-solar-text-secondary)"
                  fontSize="7"
                >
                  {d.day}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function BillingPage() {
  const [showAcquire, setShowAcquire] = useState(false);
  const solar = useSolar();
  const { session } = useAuth();
  const { addToast } = useToast();

  const { data: ledgerData, isLoading } = useQuery<PaginatedResponse<BudgetLedgerEntry>>({
    queryKey: ['billing', 'ledger'],
    queryFn: async () => {
      const response = await fetch(
        `${import.meta.env.PUBLIC_SATURN_URL ?? 'http://localhost:8006'}/v1/budget/ledger?page=1&page_size=20`,
        { headers: { Authorization: `Bearer ${session?.token}` } }
      );
      if (!response.ok) throw new Error('Failed to load ledger');
      return response.json();
    },
  });

  const entries = ledgerData?.items ?? [];
  const currentBalance = entries.length > 0 ? entries[0].balance_after : 50.00;
  const usageData = generateUsageData();
  const totalSpent30d = usageData.reduce((sum, d) => sum + d.amount, 0);

  const columns: ColumnDef<BudgetLedgerEntry>[] = [
    {
      key: 'operation',
      header: 'Type',
      cell: (v) => {
        const op = String(v);
        const variant = op === 'credit' || op === 'grant' ? 'success' : op === 'debit' ? 'error' : 'default';
        return <Badge variant={variant}>{op}</Badge>;
      },
    },
    {
      key: 'amount',
      header: 'Amount',
      cell: (v, row) => {
        const entry = row as BudgetLedgerEntry;
        const isPositive = entry.operation === 'credit' || entry.operation === 'grant';
        return (
          <span style={{ fontWeight: 600, fontSize: '0.85rem', fontFamily: 'var(--font-mono)', color: isPositive ? 'var(--color-solar-success)' : 'var(--color-solar-error)' }}>
            {isPositive ? '+' : '-'}${Math.abs(Number(v)).toFixed(4)}
          </span>
        );
      },
    },
    {
      key: 'balance_after',
      header: 'Balance',
      cell: (v) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--color-solar-text-primary)' }}>
          ${Number(v).toFixed(4)}
        </span>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      cell: (v) => (
        <span style={{ fontSize: '0.8rem', color: 'var(--color-solar-text-secondary)', maxWidth: '250px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {String(v ?? 'Task execution')}
        </span>
      ),
    },
    {
      key: 'created_at',
      header: 'Date',
      cell: (v) => (
        <span style={{ fontSize: '0.75rem', color: 'var(--color-solar-text-secondary)' }}>
          {new Date(String(v)).toLocaleString()}
        </span>
      ),
    },
  ];

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <PageHeader
          title="Budget & Billing"
          description="Monitor your credit balance, usage, and billing history."
        />
        <Button onClick={() => setShowAcquire(true)}>
          <CreditCard size={16} /> Acquire Credits
        </Button>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
        <StatsCard
          label="Credit Balance"
          value={`$${currentBalance.toFixed(2)}`}
          icon={<DollarSign size={20} />}
          planet="saturn"
          trend={currentBalance > 30 ? { direction: 'up', percent: 12 } : { direction: 'down', percent: 8 }}
        />
        <StatsCard
          label="Spent (30 days)"
          value={`$${totalSpent30d.toFixed(2)}`}
          icon={<TrendingDown size={20} />}
          planet="mars"
        />
        <StatsCard
          label="Avg/Day"
          value={`$${(totalSpent30d / 30).toFixed(2)}`}
          icon={<TrendingUp size={20} />}
          planet="venus"
        />
        <StatsCard
          label="Active Quotas"
          value="4"
          icon={<Zap size={20} />}
          planet="jupiter"
        />
      </div>

      {/* Usage Chart */}
      <div style={{ background: 'var(--color-solar-card)', border: '1px solid var(--color-solar-border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
        <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-solar-text-primary)' }}>
          Usage (Last 30 Days)
        </p>
        <UsageChart data={usageData} />
      </div>

      {/* Quota Summary */}
      <div style={{ background: 'var(--color-solar-card)', border: '1px solid var(--color-solar-border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
        <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-solar-text-primary)' }}>
          Active Quotas
        </p>
        <QuotaBar label="Tokens / Hour" used={8500} limit={25000} mode="soft" unit="tokens" />
        <QuotaBar label="Concurrent Executions" used={2} limit={5} mode="hard" unit="tasks" />
        <QuotaBar label="Monthly Budget" used={totalSpent30d} limit={100} mode="soft" unit="USD" />
        <QuotaBar label="Storage" used={128} limit={512} mode="hard" unit="MB" />
      </div>

      {/* Budget Ledger Table */}
      <div>
        <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-solar-text-primary)', marginBottom: '0.75rem' }}>
          Transaction History
        </p>
        {isLoading ? (
          <Skeleton lines={8} height="40px" />
        ) : (
          <DataTable<BudgetLedgerEntry>
            columns={columns}
            data={entries}
            emptyMessage="No transactions recorded yet."
            pagination={ledgerData ? { page: ledgerData.page, pageSize: ledgerData.page_size, total: ledgerData.total } : undefined}
          />
        )}
      </div>

      {/* Acquire Credits Modal */}
      <Modal open={showAcquire} onClose={() => setShowAcquire(false)} title="Acquire Credits">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.5rem 0' }}>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-solar-text-primary)', lineHeight: 1.6 }}>
            Credits are allocated by your organization administrator. To acquire additional credits:
          </p>
          <div style={{ background: 'var(--color-solar-bg)', border: '1px solid var(--color-solar-border)', borderRadius: 'var(--radius-md)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--color-solar-accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 600 }}>1</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-solar-text-primary)' }}>Contact your workspace admin</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--color-solar-accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 600 }}>2</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-solar-text-primary)' }}>Request a credit grant from the Admin Console</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--color-solar-accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 600 }}>3</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-solar-text-primary)' }}>Credits appear instantly after admin approval</span>
            </div>
          </div>
          <Button onClick={() => setShowAcquire(false)} style={{ alignSelf: 'flex-end' }}>Got it</Button>
        </div>
      </Modal>
    </div>
  );
}
