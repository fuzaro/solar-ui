'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

type DrawerSide = 'right' | 'left';
type DrawerSize = 'sm' | 'md' | 'lg';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  side?: DrawerSide;
  size?: DrawerSize;
  children?: React.ReactNode;
}

const SIZE_MAP: Record<DrawerSize, string> = {
  sm: '20rem',
  md: '28rem',
  lg: '36rem',
};

export function Drawer({ open, onClose, title, side = 'right', size = 'md', children }: DrawerProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const xInit = side === 'right' ? '100%' : '-100%';

  return (
    <AnimatePresence>
      {open && (
        <div className={clsx('fixed inset-0 z-50 flex', side === 'right' ? 'justify-end' : 'justify-start')}>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)' }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: xInit }}
            animate={{ x: 0 }}
            exit={{ x: xInit }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex flex-col h-full z-10 overflow-hidden"
            style={{
              width: SIZE_MAP[size],
              maxWidth: '90vw',
              background: 'var(--color-solar-surface)',
              borderLeft: side === 'right' ? '1px solid var(--color-solar-border)' : undefined,
              borderRight: side === 'left' ? '1px solid var(--color-solar-border)' : undefined,
              boxShadow: 'var(--shadow-modal)',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4 flex-shrink-0"
              style={{ borderBottom: '1px solid var(--color-solar-border)' }}
            >
              {title ? (
                <h2 className="text-base font-semibold" style={{ color: 'var(--color-solar-text-primary)' }}>
                  {title}
                </h2>
              ) : <div />}
              <button
                onClick={onClose}
                className="p-1.5 rounded-md transition-colors hover:bg-white/5"
                style={{ color: 'var(--color-solar-text-muted)' }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
