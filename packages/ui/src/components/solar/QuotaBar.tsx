import React from 'react';
import clsx from 'clsx';

export interface QuotaBarProps {
  label: string;
  used: number;
  limit: number;
  mode?: 'hard' | 'soft' | 'disabled';
  unit?: string;
  className?: string;
}

function getBarColor(ratio: number): string {
  if (ratio >= 0.95) return '#EF4444';
  if (ratio >= 0.80) return '#EAB308';
  return '#22C55E';
}

const MODE_META = {
  hard:     { label: 'Hard',     color: '#EF4444', bg: 'rgba(239,68,68,0.12)'    },
  soft:     { label: 'Soft',     color: '#EAB308', bg: 'rgba(234,179,8,0.12)'   },
  disabled: { label: 'Disabled', color: '#6B7280', bg: 'rgba(107,114,128,0.12)' },
};

export function QuotaBar({ label, used, limit, mode = 'soft', unit, className }: QuotaBarProps) {
  const ratio = limit > 0 ? Math.min(used / limit, 1) : 0;
  const barColor = mode === 'disabled' ? '#6B7280' : getBarColor(ratio);
  const modeMeta = MODE_META[mode];
  const pct = Math.round(ratio * 100);

  return (
    <div className={clsx('flex flex-col gap-1.5', className)}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium" style={{ color: 'var(--color-solar-text-secondary)' }}>
          {label}
        </span>
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-mono"
            style={{ color: 'var(--color-solar-text-muted)' }}
          >
            {used.toLocaleString()}/{limit.toLocaleString()}{unit ? ` ${unit}` : ''}
          </span>
          <span
            className="text-xs font-medium px-1.5 py-0.5 rounded"
            style={{ color: modeMeta.color, background: modeMeta.bg }}
          >
            {modeMeta.label}
          </span>
        </div>
      </div>

      {/* Bar */}
      <div
        className="relative h-1.5 rounded-full overflow-hidden"
        style={{ background: 'var(--color-solar-elevated)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: barColor,
            boxShadow: `0 0 6px ${barColor}88`,
          }}
        />
        {/* Threshold markers */}
        <div
          className="absolute top-0 bottom-0 w-px"
          style={{ left: '80%', background: 'rgba(234,179,8,0.5)' }}
        />
        <div
          className="absolute top-0 bottom-0 w-px"
          style={{ left: '95%', background: 'rgba(239,68,68,0.5)' }}
        />
      </div>
    </div>
  );
}
