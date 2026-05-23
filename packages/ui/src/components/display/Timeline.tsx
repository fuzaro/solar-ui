import React from 'react';
import clsx from 'clsx';

export interface TimelineItem {
  id: string;
  label?: string;
  title?: string;
  timestamp?: string;
  status: 'pending' | 'active' | 'completed' | 'failed' | 'success' | 'error' | 'default';
  description?: string;
}

interface TimelineProps {
  items: TimelineItem[];
  orientation?: 'vertical' | 'horizontal';
  className?: string;
}

const STATUS_COLORS: Record<TimelineItem['status'], string> = {
  pending:   'var(--color-solar-text-disabled)',
  active:    'var(--color-moon)',
  completed: 'var(--color-aura-green)',
  failed:    'var(--color-aura-red)',
  success:   'var(--color-aura-green)',
  error:     'var(--color-aura-red)',
  default:   'var(--color-solar-text-disabled)',
};

function TimelineNode({ item }: { item: TimelineItem }) {
  const color = STATUS_COLORS[item.status];
  const isActive = item.status === 'active';
  const isCompleted = item.status === 'completed' || item.status === 'success';
  const isFailed = item.status === 'failed' || item.status === 'error';

  return (
    <div
      className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 relative"
      style={{
        background: isActive ? `${color}22` : isCompleted ? `${color}22` : isFailed ? `${color}22` : 'var(--color-solar-elevated)',
        border: `2px solid ${color}`,
        boxShadow: isActive ? `0 0 10px ${color}` : undefined,
      }}
    >
      {isActive && (
        <span
          className="absolute inset-0 rounded-full"
          style={{
            border: `2px solid ${color}`,
            animation: 'solar-ping 1.5s infinite',
          }}
        />
      )}
      {isCompleted && (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 6l3 3 5-5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
      {isFailed && (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M2 2l6 6M8 2L2 8" stroke={color} strokeWidth="2" strokeLinecap="round"/>
        </svg>
      )}
      {item.status === 'pending' && (
        <span className="w-2 h-2 rounded-full" style={{ background: color }} />
      )}
    </div>
  );
}

export function Timeline({ items, orientation = 'vertical', className }: TimelineProps) {
  const isVertical = orientation === 'vertical';

  return (
    <div className={clsx(isVertical ? 'flex flex-col gap-0' : 'flex flex-row gap-0 items-start', className)}>
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        const color = STATUS_COLORS[item.status];

        return (
          <div
            key={item.id}
            className={clsx(isVertical ? 'flex flex-row gap-3' : 'flex flex-col items-center gap-1 flex-1')}
          >
            {/* Node + connector */}
            <div className={clsx(isVertical ? 'flex flex-col items-center' : 'flex flex-row items-center w-full')}>
              <TimelineNode item={item} />
              {!isLast && (
                <div
                  className={clsx(isVertical ? 'w-0.5 flex-1 min-h-[1.5rem]' : 'h-0.5 flex-1')}
                  style={{
                    background: item.status === 'completed' ? color : 'var(--color-solar-border)',
                    minWidth: isVertical ? undefined : '1rem',
                  }}
                />
              )}
            </div>

            {/* Content */}
            <div className={clsx(isVertical ? 'flex flex-col gap-0.5 pb-4 min-w-0 flex-1' : 'flex flex-col items-center gap-0.5 text-center min-w-0')}>
              <span
                className="text-sm font-medium"
                style={{ color: item.status === 'pending' ? 'var(--color-solar-text-muted)' : 'var(--color-solar-text-primary)' }}
              >
                {item.label || item.title}
              </span>
              {item.description && (
                <span className="text-xs" style={{ color: 'var(--color-solar-text-muted)' }}>
                  {item.description}
                </span>
              )}
              {item.timestamp && (
                <span className="text-xs font-mono" style={{ color: 'var(--color-solar-text-disabled)' }}>
                  {item.timestamp}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
