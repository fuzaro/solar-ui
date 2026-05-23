import React, { useState, useRef } from 'react';
import clsx from 'clsx';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export function Tooltip({ content, children, side = 'top', className }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);

  const positionStyles: Record<string, React.CSSProperties> = {
    top:    { bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: '6px' },
    bottom: { top: '100%',    left: '50%', transform: 'translateX(-50%)', marginTop: '6px'    },
    left:   { right: '100%', top: '50%',   transform: 'translateY(-50%)', marginRight: '6px'  },
    right:  { left: '100%',  top: '50%',   transform: 'translateY(-50%)', marginLeft: '6px'   },
  };

  return (
    <span
      ref={containerRef}
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && (
        <span
          className={clsx('absolute z-50 pointer-events-none whitespace-nowrap', className)}
          style={{
            ...positionStyles[side],
            background: 'var(--color-solar-elevated)',
            border: '1px solid var(--color-solar-border)',
            color: 'var(--color-solar-text-secondary)',
            padding: '0.375rem 0.625rem',
            borderRadius: '0.375rem',
            fontSize: '0.75rem',
            boxShadow: 'var(--shadow-elevated)',
            animation: 'solar-fade-in 0.1s ease-out',
          }}
        >
          {content}
        </span>
      )}
    </span>
  );
}
