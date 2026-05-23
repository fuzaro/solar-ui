import React from 'react';
import clsx from 'clsx';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  badge?: React.ReactNode;
}

export function PageHeader({ title, description, actions, badge }: PageHeaderProps) {
  return (
    <div
      className="flex items-start justify-between gap-4 px-6 pt-6 pb-5"
      style={{ borderBottom: '1px solid var(--color-solar-border)' }}
    >
      <div className="flex flex-col gap-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h2
            className="text-xl font-semibold tracking-tight"
            style={{ color: 'var(--color-solar-text-primary)' }}
          >
            {title}
          </h2>
          {badge && <span>{badge}</span>}
        </div>
        {description && (
          <p className="text-sm" style={{ color: 'var(--color-solar-text-secondary)' }}>
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
