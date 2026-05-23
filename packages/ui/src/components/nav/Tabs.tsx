import React from 'react';
import clsx from 'clsx';

interface TabItem {
  id?: string;
  value?: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

export interface TabsProps {
  items?: TabItem[];
  tabs?: TabItem[];
  value?: string;
  activeTab?: string;
  onChange?: (value: string) => void;
  onTabChange?: (value: string) => void;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export function Tabs({ items, tabs, value, activeTab, onChange, onTabChange, orientation = 'horizontal', className }: TabsProps) {
  const isVertical = orientation === 'vertical';
  const resolvedItems = items ?? tabs ?? [];
  const resolvedValue = value ?? activeTab ?? '';
  const resolvedOnChange = onChange ?? onTabChange ?? (() => {});

  return (
    <div
      className={clsx(
        isVertical ? 'flex flex-col gap-0.5' : 'flex flex-row gap-0',
        className
      )}
      style={{
        borderBottom: !isVertical ? '1px solid var(--color-solar-border)' : undefined,
        borderRight: isVertical ? '1px solid var(--color-solar-border)' : undefined,
      }}
    >
      {resolvedItems.map((item) => {
        const itemValue = item.value ?? item.id ?? '';
        const active = itemValue === resolvedValue;
        return (
          <button
            key={itemValue}
            onClick={() => resolvedOnChange(itemValue)}
            className={clsx(
              'flex items-center gap-2 text-sm font-medium transition-all duration-150',
              isVertical
                ? 'justify-start px-4 py-2.5 rounded-lg w-full'
                : 'px-4 py-3 relative',
              !active && 'hover:text-white/70'
            )}
            style={{
              color: active ? 'var(--color-moon-light)' : 'var(--color-solar-text-secondary)',
              borderBottom: !isVertical && active ? '2px solid var(--color-moon)' : !isVertical ? '2px solid transparent' : undefined,
              background: isVertical && active ? 'rgba(99,102,241,0.1)' : undefined,
            }}
          >
            {item.icon && (
              <span className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
                {item.icon}
              </span>
            )}
            {item.label}
            {item.badge !== undefined && (
              <span
                className="text-xs font-mono px-1.5 py-0.5 rounded-full"
                style={{
                  background: active ? 'rgba(99,102,241,0.2)' : 'var(--color-solar-elevated)',
                  color: active ? 'var(--color-moon-light)' : 'var(--color-solar-text-muted)',
                }}
              >
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
