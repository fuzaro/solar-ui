import React from 'react';
import clsx from 'clsx';
import { EXECUTION_STEPS } from '../../tokens/index';

interface StepLifecycleCardProps {
  currentStep: number;
  status: 'running' | 'completed' | 'failed' | 'pending';
  budgetConsumed?: {
    tokens: number;
    tokenLimit: number;
    costUsd: number;
    costLimit: number;
  };
  elapsedMs?: number;
  taskId?: string;
  className?: string;
}

function formatMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${m}m ${s}s`;
}

const STATUS_COLORS = {
  running:   '#6366F1',
  completed: '#22C55E',
  failed:    '#EF4444',
  pending:   '#6B7280',
};

export function StepLifecycleCard({
  currentStep,
  status,
  budgetConsumed,
  elapsedMs,
  taskId,
  className,
}: StepLifecycleCardProps) {
  const stepMeta = EXECUTION_STEPS.find((s) => s.id === currentStep);
  const statusColor = STATUS_COLORS[status];

  const tokenRatio = budgetConsumed && budgetConsumed.tokenLimit > 0
    ? budgetConsumed.tokens / budgetConsumed.tokenLimit
    : 0;
  const costRatio = budgetConsumed && budgetConsumed.costLimit > 0
    ? budgetConsumed.costUsd / budgetConsumed.costLimit
    : 0;

  return (
    <div
      className={clsx('rounded-xl p-4 flex flex-col gap-3', className)}
      style={{
        background: 'var(--color-solar-card)',
        border: `1px solid ${statusColor}33`,
        boxShadow: `var(--shadow-card), 0 0 20px ${statusColor}12`,
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          {taskId && (
            <span className="text-xs font-mono" style={{ color: 'var(--color-solar-text-muted)' }}>
              {taskId.slice(0, 12)}...
            </span>
          )}
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-mono font-bold tracking-wider"
              style={{ color: statusColor }}
            >
              STEP {currentStep}/7
            </span>
            <span
              className="text-xs font-mono font-bold"
              style={{ color: statusColor }}
            >
              {stepMeta?.name}
            </span>
          </div>
          {stepMeta && (
            <span className="text-xs" style={{ color: 'var(--color-solar-text-muted)' }}>
              {stepMeta.description}
            </span>
          )}
        </div>

        <div className="flex flex-col items-end gap-1">
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{
              background: `${statusColor}18`,
              color: statusColor,
              border: `1px solid ${statusColor}44`,
            }}
          >
            {status.toUpperCase()}
          </span>
          {elapsedMs !== undefined && (
            <span className="text-xs font-mono" style={{ color: 'var(--color-solar-text-muted)' }}>
              {formatMs(elapsedMs)}
            </span>
          )}
        </div>
      </div>

      {/* Step progress */}
      <div className="flex items-center gap-1">
        {EXECUTION_STEPS.map((step, idx) => {
          const isCompleted = step.id < currentStep;
          const isActive = step.id === currentStep;
          const isFailed = isActive && status === 'failed';
          const color = isFailed ? '#EF4444' : isCompleted || isActive ? statusColor : 'var(--color-solar-elevated)';
          return (
            <React.Fragment key={step.id}>
              <div
                className="w-2 h-2 rounded-full flex-shrink-0 transition-all"
                style={{
                  background: isCompleted || isActive ? color : 'var(--color-solar-elevated)',
                  boxShadow: isActive ? `0 0 6px ${color}` : undefined,
                  transform: isActive ? 'scale(1.4)' : undefined,
                }}
              />
              {idx < EXECUTION_STEPS.length - 1 && (
                <div
                  className="flex-1 h-px"
                  style={{ background: isCompleted ? statusColor : 'var(--color-solar-elevated)' }}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Budget */}
      {budgetConsumed && (
        <div className="flex gap-4 pt-1" style={{ borderTop: '1px solid var(--color-solar-border)' }}>
          <div className="flex flex-col gap-1 flex-1">
            <span className="text-xs" style={{ color: 'var(--color-solar-text-muted)' }}>Tokens</span>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--color-solar-elevated)' }}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(tokenRatio * 100, 100)}%`,
                  background: tokenRatio > 0.9 ? '#EF4444' : tokenRatio > 0.75 ? '#EAB308' : '#22C55E',
                }}
              />
            </div>
            <span className="text-xs font-mono" style={{ color: 'var(--color-solar-text-disabled)' }}>
              {budgetConsumed.tokens.toLocaleString()} / {budgetConsumed.tokenLimit.toLocaleString()}
            </span>
          </div>
          <div className="flex flex-col gap-1 flex-1">
            <span className="text-xs" style={{ color: 'var(--color-solar-text-muted)' }}>Cost</span>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--color-solar-elevated)' }}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(costRatio * 100, 100)}%`,
                  background: costRatio > 0.9 ? '#EF4444' : costRatio > 0.75 ? '#EAB308' : '#22C55E',
                }}
              />
            </div>
            <span className="text-xs font-mono" style={{ color: 'var(--color-solar-text-disabled)' }}>
              ${budgetConsumed.costUsd.toFixed(4)} / ${budgetConsumed.costLimit.toFixed(3)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
