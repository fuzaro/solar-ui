'use client';

import React, { useRef, useEffect, useState } from 'react';
import clsx from 'clsx';

export interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  label?: string;
  error?: string;
  hint?: string;
  height?: string;
  minHeight?: string;
  maxHeight?: string;
  readOnly?: boolean;
  className?: string;
}

export function CodeEditor({
  value,
  onChange,
  language = 'plaintext',
  label,
  error,
  hint,
  height,
  minHeight = '10rem',
  maxHeight = '30rem',
  readOnly,
  className,
}: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const [lines, setLines] = useState(1);

  useEffect(() => {
    setLines(value.split('\n').length);
  }, [value]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      onChange(newValue);
      // Restore cursor
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = start + 2;
          textareaRef.current.selectionEnd = start + 2;
        }
      });
    }
  }

  function syncScroll() {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }

  return (
    <div className={clsx('flex flex-col gap-1.5 w-full', className)}>
      {label && (
        <label className="text-xs font-medium" style={{ color: 'var(--color-solar-text-secondary)' }}>
          {label}
          <span
            className="ml-2 text-xs font-mono uppercase px-1.5 py-0.5 rounded"
            style={{
              background: 'var(--color-solar-elevated)',
              color: 'var(--color-solar-text-muted)',
              fontSize: '0.6rem',
              letterSpacing: '0.08em',
            }}
          >
            {language}
          </span>
        </label>
      )}

      <div
        className="relative flex rounded-lg overflow-hidden"
        style={{
          background: 'var(--color-solar-bg)',
          border: error ? '1px solid var(--color-venus)' : '1px solid var(--color-solar-border)',
          minHeight,
          maxHeight,
        }}
      >
        {/* Line numbers */}
        <div
          ref={lineNumbersRef}
          className="flex-shrink-0 overflow-hidden select-none"
          style={{
            background: 'var(--color-solar-surface)',
            borderRight: '1px solid var(--color-solar-border)',
            padding: '0.75rem 0.5rem',
            minWidth: '2.5rem',
            textAlign: 'right',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
            lineHeight: '1.6',
            color: 'var(--color-solar-text-disabled)',
            overflowY: 'hidden',
          }}
        >
          {Array.from({ length: Math.max(lines, 1) }, (_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        {/* Editor */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onScroll={syncScroll}
          readOnly={readOnly}
          spellCheck={false}
          className="flex-1 resize-none outline-none p-3 w-full"
          style={{
            background: 'transparent',
            color: 'var(--color-solar-text-primary)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
            lineHeight: '1.6',
            minHeight,
            maxHeight,
            overflowY: 'auto',
          }}
          onFocus={(e) => {
            const parent = e.currentTarget.closest('div')?.parentElement;
            if (parent) {
              (parent as HTMLElement).style.borderColor = 'var(--color-moon)';
              (parent as HTMLElement).style.boxShadow = '0 0 0 2px rgba(99,102,241,0.15)';
            }
          }}
          onBlur={(e) => {
            const parent = e.currentTarget.closest('div')?.parentElement;
            if (parent) {
              (parent as HTMLElement).style.borderColor = error ? 'var(--color-venus)' : 'var(--color-solar-border)';
              (parent as HTMLElement).style.boxShadow = 'none';
            }
          }}
        />
      </div>

      {error && (
        <p className="text-xs" style={{ color: 'var(--color-venus)' }}>{error}</p>
      )}
      {!error && hint && (
        <p className="text-xs" style={{ color: 'var(--color-solar-text-muted)' }}>{hint}</p>
      )}
    </div>
  );
}
