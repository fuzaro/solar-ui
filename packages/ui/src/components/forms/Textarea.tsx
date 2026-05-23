import React from 'react';
import clsx from 'clsx';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Textarea({ label, error, hint, className, id, ...props }: TextareaProps) {
  const textareaId = id ?? `textarea-${Math.random().toString(36).slice(2, 7)}`;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label
          htmlFor={textareaId}
          className="text-xs font-medium"
          style={{ color: 'var(--color-solar-text-secondary)' }}
        >
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        {...props}
        className={clsx(
          'w-full rounded-lg text-sm transition-all duration-150 outline-none px-3 py-2 resize-y',
          'placeholder:text-[var(--color-solar-text-disabled)]',
          className
        )}
        style={{
          background: 'var(--color-solar-card)',
          color: 'var(--color-solar-text-primary)',
          border: error
            ? '1px solid var(--color-venus)'
            : '1px solid var(--color-solar-border)',
          minHeight: '5rem',
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
      {error && (
        <p className="text-xs" style={{ color: 'var(--color-venus)' }}>{error}</p>
      )}
      {!error && hint && (
        <p className="text-xs" style={{ color: 'var(--color-solar-text-muted)' }}>{hint}</p>
      )}
    </div>
  );
}
