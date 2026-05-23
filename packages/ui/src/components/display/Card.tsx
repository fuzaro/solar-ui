import React from 'react';
import clsx from 'clsx';
import type { PlanetId } from '../../tokens/index';
import { PLANET_META } from '../../tokens/index';

export interface CardProps {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  padding?: 'sm' | 'md' | 'lg';
  planet?: PlanetId;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

const paddingMap = { sm: 'p-3', md: 'p-4', lg: 'p-6' };

export function Card({
  title,
  description,
  actions,
  footer,
  padding = 'md',
  planet,
  children,
  className,
  style: externalStyle,
  onClick,
}: CardProps) {
  const planetColor = planet ? PLANET_META[planet].color : undefined;

  return (
    <div
      className={clsx(
        'rounded-xl flex flex-col',
        onClick && 'cursor-pointer transition-all hover:-translate-y-0.5',
        className
      )}
      style={{
        background: 'var(--color-solar-card)',
        border: '1px solid var(--color-solar-border)',
        boxShadow: 'var(--shadow-card)',
        borderTopColor: planetColor ?? 'var(--color-solar-border)',
        borderTopWidth: planetColor ? 2 : 1,
        ...externalStyle,
      }}
      onClick={onClick}
    >
      {/* Header */}
      {(title || actions) && (
        <div
          className={clsx('flex items-start justify-between gap-2', padding === 'sm' ? 'px-3 pt-3' : padding === 'lg' ? 'px-6 pt-6' : 'px-4 pt-4')}
        >
          <div className="flex flex-col gap-0.5 min-w-0">
            {title && (
              <h3 className="text-sm font-semibold" style={{ color: 'var(--color-solar-text-primary)' }}>
                {title}
              </h3>
            )}
            {description && (
              <p className="text-xs" style={{ color: 'var(--color-solar-text-muted)' }}>
                {description}
              </p>
            )}
          </div>
          {actions && <div className="flex items-center gap-1 flex-shrink-0">{actions}</div>}
        </div>
      )}

      {/* Body */}
      <div className={clsx('flex-1', !title && !actions ? paddingMap[padding] : (padding === 'sm' ? 'px-3 pb-3 pt-2' : padding === 'lg' ? 'px-6 pb-6 pt-4' : 'px-4 pb-4 pt-3'))}>
        {children}
      </div>

      {/* Footer */}
      {footer && (
        <div
          className={clsx(
            'rounded-b-xl',
            padding === 'sm' ? 'px-3 py-2' : padding === 'lg' ? 'px-6 py-4' : 'px-4 py-3'
          )}
          style={{ borderTop: '1px solid var(--color-solar-border)', background: 'var(--color-solar-surface)' }}
        >
          {footer}
        </div>
      )}
    </div>
  );
}
