'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  action: () => void;
  keywords?: string[];
  group?: string;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  items: CommandItem[];
}

export function CommandPalette({ open, onClose, items }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = items.filter((item) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      item.label.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q) ||
      item.keywords?.some((k) => k.toLowerCase().includes(q))
    );
  });

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    setSelected(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelected((v) => Math.min(filtered.length - 1, v + 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelected((v) => Math.max(0, v - 1));
      }
      if (e.key === 'Enter') {
        const item = filtered[selected];
        if (item) { item.action(); onClose(); }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, filtered, selected, onClose]);

  // Group items
  const groups = filtered.reduce<Record<string, CommandItem[]>>((acc, item) => {
    const g = item.group ?? 'Actions';
    if (!acc[g]) acc[g] = [];
    acc[g].push(item);
    return acc;
  }, {});

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] px-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -4 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-lg rounded-2xl overflow-hidden"
            style={{
              background: 'var(--color-solar-elevated)',
              border: '1px solid var(--color-solar-border)',
              boxShadow: 'var(--shadow-modal)',
            }}
          >
            {/* Search input */}
            <div
              className="flex items-center gap-3 px-4 py-3"
              style={{ borderBottom: '1px solid var(--color-solar-border)' }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: 'var(--color-solar-text-muted)', flexShrink: 0 }}>
                <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M9.5 9.5L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search commands..."
                className="flex-1 text-sm outline-none bg-transparent"
                style={{ color: 'var(--color-solar-text-primary)' }}
              />
              <kbd
                className="text-xs px-1.5 py-0.5 rounded font-mono"
                style={{
                  background: 'var(--color-solar-card)',
                  color: 'var(--color-solar-text-muted)',
                  border: '1px solid var(--color-solar-border)',
                }}
              >
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div className="overflow-y-auto" style={{ maxHeight: '60vh' }}>
              {filtered.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm" style={{ color: 'var(--color-solar-text-muted)' }}>
                    No results for &ldquo;{query}&rdquo;
                  </p>
                </div>
              ) : (
                Object.entries(groups).map(([group, groupItems]) => {
                  let globalIdx = filtered.indexOf(groupItems[0]);
                  return (
                    <div key={group} className="py-1">
                      <div
                        className="px-4 py-1.5 text-xs font-medium uppercase tracking-wider"
                        style={{ color: 'var(--color-solar-text-disabled)' }}
                      >
                        {group}
                      </div>
                      {groupItems.map((item) => {
                        const idx = filtered.indexOf(item);
                        const isSelected = idx === selected;
                        return (
                          <div
                            key={item.id}
                            className="flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-all"
                            style={{
                              background: isSelected ? 'rgba(99,102,241,0.1)' : undefined,
                              borderLeft: isSelected ? '2px solid var(--color-moon)' : '2px solid transparent',
                            }}
                            onMouseEnter={() => setSelected(idx)}
                            onClick={() => { item.action(); onClose(); }}
                          >
                            {item.icon && (
                              <span
                                className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center"
                                style={{
                                  background: isSelected ? 'rgba(99,102,241,0.15)' : 'var(--color-solar-card)',
                                  color: isSelected ? 'var(--color-moon-light)' : 'var(--color-solar-text-muted)',
                                }}
                              >
                                {item.icon}
                              </span>
                            )}
                            <div className="flex-1 min-w-0">
                              <p
                                className="text-sm font-medium"
                                style={{ color: isSelected ? 'var(--color-solar-text-primary)' : 'var(--color-solar-text-secondary)' }}
                              >
                                {item.label}
                              </p>
                              {item.description && (
                                <p className="text-xs truncate" style={{ color: 'var(--color-solar-text-muted)' }}>
                                  {item.description}
                                </p>
                              )}
                            </div>
                            {isSelected && (
                              <kbd
                                className="text-xs px-1.5 py-0.5 rounded font-mono flex-shrink-0"
                                style={{
                                  background: 'var(--color-solar-card)',
                                  color: 'var(--color-solar-text-muted)',
                                  border: '1px solid var(--color-solar-border)',
                                }}
                              >
                                ↵
                              </kbd>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div
              className="flex items-center gap-4 px-4 py-2"
              style={{ borderTop: '1px solid var(--color-solar-border)' }}
            >
              <span className="text-xs flex items-center gap-1" style={{ color: 'var(--color-solar-text-muted)' }}>
                <kbd className="text-xs font-mono px-1 rounded" style={{ background: 'var(--color-solar-card)', border: '1px solid var(--color-solar-border)' }}>↑↓</kbd>
                Navigate
              </span>
              <span className="text-xs flex items-center gap-1" style={{ color: 'var(--color-solar-text-muted)' }}>
                <kbd className="text-xs font-mono px-1 rounded" style={{ background: 'var(--color-solar-card)', border: '1px solid var(--color-solar-border)' }}>↵</kbd>
                Select
              </span>
              <span className="text-xs ml-auto" style={{ color: 'var(--color-solar-text-disabled)' }}>
                {filtered.length} results
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
