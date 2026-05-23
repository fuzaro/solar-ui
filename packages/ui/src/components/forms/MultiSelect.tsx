'use client';

import React, { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';

interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  label?: string;
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
  error?: string;
}

export function MultiSelect({ label, options, value, onChange, placeholder = 'Select...', className, error }: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    }
    if (open) document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  function toggle(optValue: string) {
    if (value.includes(optValue)) {
      onChange(value.filter((v) => v !== optValue));
    } else {
      onChange([...value, optValue]);
    }
  }

  function removeTag(optValue: string, e: React.MouseEvent) {
    e.stopPropagation();
    onChange(value.filter((v) => v !== optValue));
  }

  const selectedLabels = value.map((v) => options.find((o) => o.value === v)?.label ?? v);

  return (
    <div ref={containerRef} className={clsx('flex flex-col gap-1.5 w-full relative', className)}>
      {label && (
        <label className="text-xs font-medium" style={{ color: 'var(--color-solar-text-secondary)' }}>
          {label}
        </label>
      )}
      {/* Trigger */}
      <div
        className="flex flex-wrap items-center gap-1 min-h-[2.25rem] rounded-lg px-2 py-1 cursor-pointer transition-all"
        style={{
          background: 'var(--color-solar-card)',
          border: error ? '1px solid var(--color-venus)' : open ? '1px solid var(--color-moon)' : '1px solid var(--color-solar-border)',
          boxShadow: open ? '0 0 0 2px rgba(99,102,241,0.15)' : undefined,
        }}
        onClick={() => setOpen((v) => !v)}
      >
        {value.length === 0 && (
          <span className="text-sm px-1" style={{ color: 'var(--color-solar-text-disabled)' }}>
            {placeholder}
          </span>
        )}
        {selectedLabels.map((lbl, i) => (
          <span
            key={value[i]}
            className="inline-flex items-center gap-1 text-xs rounded px-1.5 py-0.5"
            style={{
              background: 'var(--color-solar-elevated)',
              color: 'var(--color-solar-text-secondary)',
              border: '1px solid var(--color-solar-border)',
            }}
          >
            {lbl}
            <span
              className="cursor-pointer opacity-60 hover:opacity-100 transition-opacity"
              onClick={(e) => removeTag(value[i], e)}
            >
              ×
            </span>
          </span>
        ))}
        <span className="ml-auto" style={{ color: 'var(--color-solar-text-muted)' }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      </div>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute top-full left-0 right-0 mt-1 rounded-lg py-1 z-50 overflow-hidden"
          style={{
            background: 'var(--color-solar-elevated)',
            border: '1px solid var(--color-solar-border)',
            boxShadow: 'var(--shadow-elevated)',
          }}
        >
          <div className="px-2 py-1.5" style={{ borderBottom: '1px solid var(--color-solar-border)' }}>
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full text-xs rounded px-2 py-1 outline-none"
              style={{
                background: 'var(--color-solar-card)',
                color: 'var(--color-solar-text-primary)',
                border: '1px solid var(--color-solar-border)',
              }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="max-h-40 overflow-y-auto">
            {filtered.length === 0 && (
              <p className="px-3 py-2 text-xs" style={{ color: 'var(--color-solar-text-muted)' }}>
                No options found
              </p>
            )}
            {filtered.map((opt) => {
              const selected = value.includes(opt.value);
              return (
                <div
                  key={opt.value}
                  className="flex items-center gap-2 px-3 py-2 cursor-pointer text-xs transition-colors hover:bg-white/5"
                  style={{ color: selected ? 'var(--color-moon-light)' : 'var(--color-solar-text-secondary)' }}
                  onClick={() => toggle(opt.value)}
                >
                  <span
                    className="w-3.5 h-3.5 rounded flex items-center justify-center flex-shrink-0"
                    style={{
                      background: selected ? 'var(--color-moon)' : 'transparent',
                      border: `1px solid ${selected ? 'var(--color-moon)' : 'var(--color-solar-border)'}`,
                    }}
                  >
                    {selected && (
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                        <path d="M1 4.5L3 6.5l4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    )}
                  </span>
                  {opt.label}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {error && (
        <p className="text-xs" style={{ color: 'var(--color-venus)' }}>{error}</p>
      )}
    </div>
  );
}
