'use client';

import React, { useState } from 'react';
import clsx from 'clsx';

type AlertType = 'info' | 'warning' | 'error' | 'success';

interface AlertBannerProps {
  type: AlertType;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  dismissible?: boolean;
  className?: string;
}

const ALERT_STYLES: Record<AlertType, { color: string; bg: string; border: string }> = {
  info:    { color: '#60A5FA', bg: 'rgba(96,165,250,0.08)',  border: 'rgba(96,165,250,0.2)'  },
  warning: { color: '#EAB308', bg: 'rgba(234,179,8,0.08)',   border: 'rgba(234,179,8,0.2)'   },
  error:   { color: '#EF4444', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.2)'   },
  success: { color: '#22C55E', bg: 'rgba(34,197,94,0.08)',   border: 'rgba(34,197,94,0.2)'   },
};

const ALERT_ICONS: Record<AlertType, React.ReactNode> = {
  info: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5"/><path d="M8 7v4M8 5.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  warning: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2.5L1.5 13.5h13L8 2.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M8 7v3M8 11.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  error: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5"/><path d="M5 5l6 6M11 5L5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  success: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5"/><path d="M5 8l2.5 2.5 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
};

export function AlertBanner({ type, title, description, actions, dismissible, className }: AlertBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const styles = ALERT_STYLES[type];

  if (dismissed) return null;

  return (
    <div
      className={clsx('flex items-start gap-3 rounded-xl px-4 py-3', className)}
      style={{
        background: styles.bg,
        border: `1px solid ${styles.border}`,
        borderLeft: `3px solid ${styles.color}`,
      }}
    >
      <span className="flex-shrink-0 mt-0.5" style={{ color: styles.color }}>
        {ALERT_ICONS[type]}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium" style={{ color: 'var(--color-solar-text-primary)' }}>
          {title}
        </p>
        {description && (
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-solar-text-secondary)' }}>
            {description}
          </p>
        )}
        {actions && (
          <div className="flex items-center gap-2 mt-2">
            {actions}
          </div>
        )}
      </div>
      {dismissible && (
        <button
          onClick={() => setDismissed(true)}
          className="flex-shrink-0 p-0.5 rounded opacity-50 hover:opacity-100 transition-opacity"
          style={{ color: 'var(--color-solar-text-muted)' }}
          aria-label="Dismiss"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M1.5 1.5l9 9M10.5 1.5l-9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      )}
    </div>
  );
}
