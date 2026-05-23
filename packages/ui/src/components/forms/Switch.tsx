import React from 'react';
import clsx from 'clsx';

interface SwitchProps {
  label?: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function Switch({ label, description, checked, onChange, disabled, className }: SwitchProps) {
  return (
    <label
      className={clsx(
        'flex items-start gap-3 cursor-pointer select-none',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {/* Toggle */}
      <div
        className="relative flex-shrink-0 mt-0.5"
        onClick={() => !disabled && onChange(!checked)}
      >
        <div
          className="w-9 h-5 rounded-full transition-all duration-200"
          style={{
            background: checked ? 'var(--color-moon)' : 'var(--color-solar-elevated)',
            border: checked ? '1px solid var(--color-moon)' : '1px solid var(--color-solar-border)',
            boxShadow: checked ? '0 0 8px rgba(99,102,241,0.3)' : undefined,
          }}
        />
        <div
          className="absolute top-0.5 rounded-full transition-all duration-200"
          style={{
            width: '1rem',
            height: '1rem',
            background: 'white',
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
            left: checked ? 'calc(100% - 1.25rem)' : '2px',
          }}
        />
      </div>

      {/* Text */}
      {(label || description) && (
        <div className="flex flex-col gap-0.5 min-w-0">
          {label && (
            <span className="text-sm font-medium" style={{ color: 'var(--color-solar-text-primary)' }}>
              {label}
            </span>
          )}
          {description && (
            <span className="text-xs" style={{ color: 'var(--color-solar-text-muted)' }}>
              {description}
            </span>
          )}
        </div>
      )}
    </label>
  );
}
