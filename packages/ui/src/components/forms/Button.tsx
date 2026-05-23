import React from 'react';
import clsx from 'clsx';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'link' | 'outline';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  children?: React.ReactNode;
}

const SIZE_CLASSES: Record<ButtonSize, string> = {
  xs: 'text-xs px-2 py-1 gap-1',
  sm: 'text-xs px-3 py-1.5 gap-1.5',
  md: 'text-sm px-4 py-2 gap-2',
  lg: 'text-sm px-5 py-2.5 gap-2',
};

const VARIANT_STYLES: Record<ButtonVariant, React.CSSProperties> = {
  primary:   { background: 'var(--color-moon)', color: 'white', border: '1px solid transparent' },
  secondary: { background: 'transparent', color: 'var(--color-solar-text-secondary)', border: '1px solid var(--color-solar-border)' },
  outline:   { background: 'transparent', color: 'var(--color-solar-text-secondary)', border: '1px solid var(--color-solar-border)' },
  ghost:     { background: 'transparent', color: 'var(--color-solar-text-secondary)', border: '1px solid transparent' },
  danger:    { background: 'var(--color-venus)', color: 'white', border: '1px solid transparent' },
  link:      { background: 'transparent', color: 'var(--color-solar-text-link)', border: '1px solid transparent' },
};

const VARIANT_HOVER: Record<ButtonVariant, string> = {
  primary:   'hover:brightness-110 hover:shadow-lg',
  secondary: 'hover:bg-white/5 hover:border-[var(--color-solar-border-hover)]',
  outline:   'hover:bg-white/5 hover:border-[var(--color-solar-border-hover)]',
  ghost:     'hover:bg-white/5',
  danger:    'hover:brightness-110',
  link:      'hover:underline',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  icon,
  iconPosition = 'left',
  children,
  disabled,
  className,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      {...props}
      disabled={isDisabled}
      className={clsx(
        'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 select-none',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        SIZE_CLASSES[size],
        VARIANT_HOVER[variant],
        variant === 'primary' && 'shadow-sm',
        variant === 'link' && 'p-0 rounded-none',
        className
      )}
      style={{
        ...VARIANT_STYLES[variant],
        boxShadow: variant === 'primary' ? '0 0 0 0 rgba(99,102,241,0)' : undefined,
        transition: 'all 0.15s ease',
      }}
      onMouseEnter={(e) => {
        if (variant === 'primary' && !isDisabled) {
          (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 12px rgba(99,102,241,0.4)';
        }
        props.onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        if (variant === 'primary') {
          (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 0 0 rgba(99,102,241,0)';
        }
        props.onMouseLeave?.(e);
      }}
    >
      {loading && (
        <svg
          className="animate-spin"
          width="14" height="14" viewBox="0 0 14 14" fill="none"
          style={{ animation: 'solar-spin 0.8s linear infinite' }}
        >
          <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="2" strokeOpacity="0.3"/>
          <path d="M7 1.5A5.5 5.5 0 0112.5 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      )}
      {!loading && icon && iconPosition === 'left' && icon}
      {children}
      {!loading && icon && iconPosition === 'right' && icon}
    </button>
  );
}
