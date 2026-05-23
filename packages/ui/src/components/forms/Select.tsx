import React from 'react';
import clsx from 'clsx';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  error?: string;
  options?: SelectOption[];
  placeholder?: string;
  children?: React.ReactNode;
}

export function Select({ label, error, options, placeholder, className, id, children, ...props }: SelectProps) {
  const selectId = id ?? `select-${Math.random().toString(36).slice(2, 7)}`;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label
          htmlFor={selectId}
          className="text-xs font-medium"
          style={{ color: 'var(--color-solar-text-secondary)' }}
        >
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          {...props}
          className={clsx(
            'w-full rounded-lg text-sm transition-all duration-150 outline-none px-3 py-2 pr-8 appearance-none cursor-pointer',
            className
          )}
          style={{
            background: 'var(--color-solar-card)',
            color: 'var(--color-solar-text-primary)',
            border: error
              ? '1px solid var(--color-venus)'
              : '1px solid var(--color-solar-border)',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = error ? 'var(--color-venus)' : 'var(--color-moon)';
            e.currentTarget.style.boxShadow = '0 0 0 2px rgba(99,102,241,0.15)';
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = error ? 'var(--color-venus)' : 'var(--color-solar-border)';
            e.currentTarget.style.boxShadow = 'none';
            props.onBlur?.(e);
          }}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                  {opt.label}
                </option>
              ))
            : children
          }
        </select>
        {/* Custom chevron */}
        <span
          className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: 'var(--color-solar-text-muted)' }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      </div>
      {error && (
        <p className="text-xs" style={{ color: 'var(--color-venus)' }}>{error}</p>
      )}
    </div>
  );
}
