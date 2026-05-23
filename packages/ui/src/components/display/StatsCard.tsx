import React from 'react';
import clsx from 'clsx';
import type { PlanetId } from '../../tokens/index';
import { PLANET_META } from '../../tokens/index';

interface TrendInfo {
  direction: 'up' | 'down' | 'flat';
  percent: number;
}

interface StatsCardProps {
  label: string;
  value: string | number;
  trend?: TrendInfo;
  icon?: React.ReactNode;
  planet?: PlanetId;
  description?: string;
  className?: string;
}

function TrendIndicator({ trend }: { trend: TrendInfo }) {
  const isUp = trend.direction === 'up';
  const isDown = trend.direction === 'down';
  const color = isUp ? '#22C55E' : isDown ? '#EF4444' : 'var(--color-solar-text-muted)';

  return (
    <span className="flex items-center gap-1 text-xs font-medium" style={{ color }}>
      {trend.direction === 'up' && (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M6 9V3M3 6l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
      {trend.direction === 'down' && (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M6 3v6M9 6L6 9 3 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
      {trend.direction === 'flat' && (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 6h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      )}
      {trend.percent}%
    </span>
  );
}

export function StatsCard({ label, value, trend, icon, planet, description, className }: StatsCardProps) {
  const planetColor = planet ? PLANET_META[planet].color : 'var(--color-moon)';
  const planetGlow = planet ? PLANET_META[planet].glow : 'rgba(99,102,241,0.2)';

  return (
    <div
      className={clsx('rounded-xl p-4 flex flex-col gap-3', className)}
      style={{
        background: 'var(--color-solar-card)',
        border: '1px solid var(--color-solar-border)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-solar-text-muted)' }}>
          {label}
        </span>
        {icon && (
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              background: `${planetColor}18`,
              color: planetColor,
              boxShadow: `0 0 8px ${planetGlow}`,
            }}
          >
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-end justify-between gap-2">
        <span
          className="text-2xl font-bold tracking-tight font-mono"
          style={{ color: 'var(--color-solar-text-primary)' }}
        >
          {value}
        </span>
        {trend && <TrendIndicator trend={trend} />}
      </div>

      {description && (
        <p className="text-xs" style={{ color: 'var(--color-solar-text-muted)' }}>
          {description}
        </p>
      )}

      {/* Accent bar */}
      <div className="h-0.5 rounded-full" style={{ background: `linear-gradient(90deg, ${planetColor} 0%, transparent 100%)` }} />
    </div>
  );
}
