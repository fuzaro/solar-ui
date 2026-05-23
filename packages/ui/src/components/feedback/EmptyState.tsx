import React from 'react';
import clsx from 'clsx';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={clsx('flex flex-col items-center justify-center gap-4 py-12 px-6 text-center', className)}>
      {icon && (
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{
            background: 'var(--color-solar-elevated)',
            color: 'var(--color-solar-text-muted)',
          }}
        >
          {icon}
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--color-solar-text-primary)' }}>
          {title}
        </h3>
        {description && (
          <p className="text-xs max-w-xs" style={{ color: 'var(--color-solar-text-muted)' }}>
            {description}
          </p>
        )}
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
          style={{
            background: 'var(--color-moon)',
            color: 'white',
          }}
          onMouseEnter={(e) => { (e.currentTarget).style.boxShadow = '0 0 12px rgba(99,102,241,0.4)'; }}
          onMouseLeave={(e) => { (e.currentTarget).style.boxShadow = 'none'; }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
