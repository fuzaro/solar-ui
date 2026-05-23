import React from 'react';
import clsx from 'clsx';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  label?: string;
  className?: string;
}

const SIZE_MAP = { sm: 16, md: 24, lg: 36 };
const STROKE_MAP = { sm: 2, md: 2.5, lg: 3 };

export function LoadingSpinner({ size = 'md', color, label, className }: LoadingSpinnerProps) {
  const px = SIZE_MAP[size];
  const stroke = STROKE_MAP[size];
  const spinColor = color ?? 'var(--color-moon)';

  return (
    <span className={clsx('inline-flex items-center gap-2', className)}>
      <svg
        width={px}
        height={px}
        viewBox={`0 0 ${px} ${px}`}
        fill="none"
        style={{ animation: 'solar-spin 0.75s linear infinite' }}
        aria-hidden
      >
        <circle
          cx={px / 2}
          cy={px / 2}
          r={px / 2 - stroke}
          stroke={spinColor}
          strokeWidth={stroke}
          strokeOpacity="0.25"
        />
        <path
          d={`M ${px / 2} ${stroke} A ${px / 2 - stroke} ${px / 2 - stroke} 0 0 1 ${px - stroke} ${px / 2}`}
          stroke={spinColor}
          strokeWidth={stroke}
          strokeLinecap="round"
        />
      </svg>
      {label && (
        <span className="text-sm" style={{ color: 'var(--color-solar-text-muted)' }}>
          {label}
        </span>
      )}
    </span>
  );
}
