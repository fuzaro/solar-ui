import React from 'react';

export interface FormFieldProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  id?: string;
}

export function FormField({ label, error, hint, required, children, className, style, id }: FormFieldProps) {
  return (
    <div className={`flex flex-col gap-1.5 w-full ${className ?? ''}`} style={style}>
      {label && (
        <label
          htmlFor={id}
          className="text-xs font-medium"
          style={{ color: 'var(--color-solar-text-secondary)' }}
        >
          {label}
          {required && (
            <span className="ml-0.5" style={{ color: 'var(--color-venus)' }}>*</span>
          )}
        </label>
      )}
      {children}
      {error && (
        <p className="text-xs flex items-center gap-1" style={{ color: 'var(--color-venus)' }}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
            <path d="M5 1a4 4 0 100 8A4 4 0 005 1zm.5 5.5h-1v-1h1v1zm0-2h-1V3h1v1.5z"/>
          </svg>
          {error}
        </p>
      )}
      {!error && hint && (
        <p className="text-xs" style={{ color: 'var(--color-solar-text-muted)' }}>{hint}</p>
      )}
    </div>
  );
}
