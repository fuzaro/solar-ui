import React from 'react';
import clsx from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export function Input({ label, error, hint, icon, iconPosition = 'left', className, id, ...props }: InputProps) {
  const inputId = id ?? `input-${Math.random().toString(36).slice(2, 7)}`;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-medium"
          style={{ color: 'var(--color-solar-text-secondary)' }}
        >
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {icon && iconPosition === 'left' && (
          <span
            className="absolute left-3 flex items-center pointer-events-none"
            style={{ color: 'var(--color-solar-text-muted)' }}
          >
            {icon}
          </span>
        )}
        <input
          id={inputId}
          {...props}
          className={clsx(
            'w-full rounded-lg text-sm transition-all duration-150 outline-none',
            'placeholder:text-[var(--color-solar-text-disabled)]',
            icon && iconPosition === 'left' && 'pl-9',
            icon && iconPosition === 'right' && 'pr-9',
            !icon && 'px-3',
            icon && iconPosition === 'left' ? '' : 'pl-3',
            'py-2',
            className
          )}
          style={{
            background: 'var(--color-solar-card)',
            color: 'var(--color-solar-text-primary)',
            border: error
              ? '1px solid var(--color-venus)'
              : '1px solid var(--color-solar-border)',
            paddingLeft: icon && iconPosition === 'left' ? '2.25rem' : '0.75rem',
            paddingRight: icon && iconPosition === 'right' ? '2.25rem' : '0.75rem',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = error ? 'var(--color-venus)' : 'var(--color-moon)';
            e.currentTarget.style.boxShadow = error
              ? '0 0 0 2px rgba(244,63,94,0.15)'
              : '0 0 0 2px rgba(99,102,241,0.15)';
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = error ? 'var(--color-venus)' : 'var(--color-solar-border)';
            e.currentTarget.style.boxShadow = 'none';
            props.onBlur?.(e);
          }}
        />
        {icon && iconPosition === 'right' && (
          <span
            className="absolute right-3 flex items-center pointer-events-none"
            style={{ color: 'var(--color-solar-text-muted)' }}
          >
            {icon}
          </span>
        )}
      </div>
      {error && (
        <p className="text-xs" style={{ color: 'var(--color-venus)' }}>{error}</p>
      )}
      {!error && hint && (
        <p className="text-xs" style={{ color: 'var(--color-solar-text-muted)' }}>{hint}</p>
      )}
    </div>
  );
}
