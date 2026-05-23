import React from 'react';
import clsx from 'clsx';
import type { PlanetId, AuraBand } from '../../tokens/index';
import { PLANET_META, AURA_META } from '../../tokens/index';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'neutral' | PlanetId | AuraBand;
type BadgeSize = 'sm' | 'md';

export interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

function getVariantStyles(variant: BadgeVariant): { color: string; bg: string; border: string } {
  const planetIds: PlanetId[] = ['sun','moon','mercury','venus','mars','saturn','neptune','pluto','themis','jupiter'];
  const auraBands: AuraBand[] = ['green','yellow','orange','red','violet','dim'];

  if (planetIds.includes(variant as PlanetId)) {
    const meta = PLANET_META[variant as PlanetId];
    return {
      color: meta.color,
      bg: `${meta.color}18`,
      border: `${meta.color}44`,
    };
  }

  if (auraBands.includes(variant as AuraBand)) {
    const meta = AURA_META[variant as AuraBand];
    return {
      color: meta.color,
      bg: `${meta.color}18`,
      border: `${meta.color}44`,
    };
  }

  switch (variant) {
    case 'success': return { color: '#22C55E', bg: 'rgba(34,197,94,0.12)',  border: 'rgba(34,197,94,0.3)' };
    case 'warning': return { color: '#EAB308', bg: 'rgba(234,179,8,0.12)',  border: 'rgba(234,179,8,0.3)' };
    case 'error':   return { color: '#EF4444', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)' };
    case 'info':    return { color: '#60A5FA', bg: 'rgba(96,165,250,0.12)', border: 'rgba(96,165,250,0.3)' };
    case 'neutral': return { color: 'var(--color-solar-text-secondary)', bg: 'var(--color-solar-elevated)', border: 'var(--color-solar-border)' };
    default:        return {
      color: 'var(--color-solar-text-secondary)',
      bg:    'var(--color-solar-elevated)',
      border:'var(--color-solar-border)',
    };
  }
}

export function Badge({ variant = 'default', size = 'md', dot, children, className, style: externalStyle, onClick }: BadgeProps) {
  const styles = getVariantStyles(variant);

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 font-medium rounded-full border leading-none',
        size === 'sm' ? 'text-xs px-1.5 py-0.5' : 'text-xs px-2 py-1',
        onClick && 'cursor-pointer',
        className
      )}
      style={{ color: styles.color, background: styles.bg, borderColor: styles.border, ...externalStyle }}
      onClick={onClick}
    >
      {dot && (
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ background: styles.color }}
        />
      )}
      {children}
    </span>
  );
}
