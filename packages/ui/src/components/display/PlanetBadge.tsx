import React from 'react';
import clsx from 'clsx';
import type { PlanetId } from '../../tokens/index';
import { PLANET_META } from '../../tokens/index';

interface PlanetBadgeProps {
  planet: PlanetId;
  size?: 'sm' | 'md' | 'lg';
  showPort?: boolean;
  className?: string;
}

export function PlanetBadge({ planet, size = 'md', showPort, className }: PlanetBadgeProps) {
  const meta = PLANET_META[planet];
  const dotSize = size === 'sm' ? 6 : size === 'lg' ? 10 : 8;
  const textSize = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-sm' : 'text-xs';

  return (
    <span className={clsx('inline-flex items-center gap-1.5 font-medium', textSize, className)}>
      <span
        className="rounded-full flex-shrink-0"
        style={{
          width: dotSize,
          height: dotSize,
          background: meta.color,
          boxShadow: `0 0 ${dotSize}px ${meta.glow}`,
        }}
      />
      <span style={{ color: meta.color }}>{meta.label}</span>
      {showPort && meta.port > 0 && (
        <span className="font-mono opacity-60" style={{ color: 'var(--color-solar-text-muted)', fontSize: '0.65rem' }}>
          :{meta.port}
        </span>
      )}
    </span>
  );
}
