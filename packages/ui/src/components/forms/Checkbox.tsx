import React from 'react';
import clsx from 'clsx';

interface CheckboxProps {
  label?: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function Checkbox({ label, description, checked, onChange, disabled, className }: CheckboxProps) {
  return (
    <label
      className={clsx(
        'flex items-start gap-2.5 cursor-pointer select-none',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <div
        className="relative flex-shrink-0 w-4 h-4 mt-0.5 rounded transition-all duration-150"
        onClick={() => !disabled && onChange(!checked)}
        style={{
          background: checked ? 'var(--color-moon)' : 'transparent',
          border: checked ? '1px solid var(--color-moon)' : '1px solid var(--color-solar-border)',
          boxShadow: checked ? '0 0 6px rgba(99,102,241,0.3)' : undefined,
        }}
      >
        {checked && (
          <svg
            className="absolute inset-0 w-full h-full p-0.5"
            viewBox="0 0 10 10"
            fill="none"
          >
            <path
              d="M1.5 5.5L4 8l4.5-5"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
      {(label || description) && (
        <div className="flex flex-col gap-0.5 min-w-0">
          {label && (
            <span className="text-sm" style={{ color: 'var(--color-solar-text-primary)' }}>
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
