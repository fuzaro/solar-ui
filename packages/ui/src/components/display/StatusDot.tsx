import React from 'react';
import clsx from 'clsx';
import type { AuraBand } from '../../tokens/index';

type StatusType = AuraBand | 'healthy' | 'degraded' | 'unreachable' | 'maintenance';

interface StatusDotProps {
  status: StatusType;
  pulse?: boolean;
  label?: string;
  className?: string;
}

const STATUS_COLORS: Record<string, string> = {
  green:       '#22C55E',
  yellow:      '#EAB308',
  orange:      '#F97316',
  red:         '#EF4444',
  violet:      '#8B5CF6',
  dim:         '#6B7280',
  healthy:     '#22C55E',
  degraded:    '#EAB308',
  unreachable: '#EF4444',
  maintenance: '#8B5CF6',
};

export function StatusDot({ status, pulse, label, className }: StatusDotProps) {
  const color = STATUS_COLORS[status] ?? '#6B7280';

  return (
    <span className={clsx('inline-flex items-center gap-1.5', className)}>
      <span className="relative flex items-center justify-center w-2 h-2 flex-shrink-0">
        {pulse && (
          <span
            className="absolute inset-0 rounded-full"
            style={{
              background: color,
              animation: 'solar-ping 1.5s cubic-bezier(0,0,0.2,1) infinite',
              opacity: 0.6,
            }}
          />
        )}
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ background: color }}
        />
      </span>
      {label && (
        <span className="text-xs" style={{ color: 'var(--color-solar-text-secondary)' }}>
          {label}
        </span>
      )}
    </span>
  );
}
