import React from 'react';
import clsx from 'clsx';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  lines?: number;
  className?: string;
  rounded?: boolean;
}

function SkeletonLine({ width, height, rounded, className }: Omit<SkeletonProps, 'lines'>) {
  return (
    <div
      className={clsx('solar-shimmer', rounded ? 'rounded-full' : 'rounded-md', className)}
      style={{
        width: width ?? '100%',
        height: height ?? '1rem',
        background: 'linear-gradient(90deg, var(--color-solar-card) 25%, var(--color-solar-elevated) 50%, var(--color-solar-card) 75%)',
        backgroundSize: '200% 100%',
        animation: 'solar-shimmer 1.5s infinite',
      }}
    />
  );
}

export function Skeleton({ width, height, lines = 1, className, rounded }: SkeletonProps) {
  if (lines <= 1) {
    return <SkeletonLine width={width} height={height} rounded={rounded} className={className} />;
  }

  return (
    <div className={clsx('flex flex-col gap-2', className)}>
      {Array.from({ length: lines }, (_, i) => (
        <SkeletonLine
          key={i}
          height={height ?? '1rem'}
          width={i === lines - 1 ? '65%' : '100%'}
          rounded={rounded}
        />
      ))}
    </div>
  );
}
