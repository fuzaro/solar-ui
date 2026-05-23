'use client';

import React, { useState } from 'react';
import clsx from 'clsx';

interface JsonViewerProps {
  data: unknown;
  collapsed?: boolean;
  maxHeight?: string;
  className?: string;
}

function colorizeJson(json: string): React.ReactNode[] {
  const lines = json.split('\n');
  return lines.map((line, i) => {
    // Colorize: keys, strings, numbers, booleans, null
    const parts: React.ReactNode[] = [];
    let remaining = line;
    let keyIdx = 0;

    // Simple tokenizer
    const tokenRegex = /("(?:[^"\\]|\\.)*")\s*:|("(?:[^"\\]|\\.)*")|(true|false|null)|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    tokenRegex.lastIndex = 0;
    while ((match = tokenRegex.exec(line)) !== null) {
      // Add plain text before match
      if (match.index > lastIndex) {
        parts.push(<span key={`plain-${i}-${keyIdx++}`}>{line.slice(lastIndex, match.index)}</span>);
      }

      if (match[1] !== undefined) {
        // Key
        parts.push(
          <span key={`key-${i}-${keyIdx++}`} style={{ color: '#60A5FA' }}>{match[1]}</span>,
          <span key={`colon-${i}-${keyIdx++}`}>{line.slice(match.index + match[1].length, match.index + match[0].length)}</span>
        );
      } else if (match[2] !== undefined) {
        // String value
        parts.push(<span key={`str-${i}-${keyIdx++}`} style={{ color: '#86EFAC' }}>{match[2]}</span>);
      } else if (match[3] !== undefined) {
        // Boolean/null
        parts.push(<span key={`bool-${i}-${keyIdx++}`} style={{ color: '#FB7185' }}>{match[3]}</span>);
      } else if (match[4] !== undefined) {
        // Number
        parts.push(<span key={`num-${i}-${keyIdx++}`} style={{ color: '#FCD34D' }}>{match[4]}</span>);
      }

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < line.length) {
      parts.push(<span key={`end-${i}-${keyIdx++}`}>{line.slice(lastIndex)}</span>);
    }

    return parts.length > 0 ? parts : [<span key={`line-${i}`}>{line}</span>];
  }).map((lineParts, i) => (
    <div key={i}>{lineParts}</div>
  ));
}

export function JsonViewer({ data, collapsed = false, maxHeight = '400px', className }: JsonViewerProps) {
  const [isCollapsed, setIsCollapsed] = useState(collapsed);
  const [copied, setCopied] = useState(false);

  const jsonStr = JSON.stringify(data, null, 2);

  function handleCopy() {
    navigator.clipboard.writeText(jsonStr).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div
      className={clsx('rounded-lg overflow-hidden', className)}
      style={{ border: '1px solid var(--color-solar-border)', background: 'var(--color-solar-surface)' }}
    >
      {/* Toolbar */}
      <div
        className="flex items-center justify-between px-3 py-2"
        style={{ borderBottom: '1px solid var(--color-solar-border)' }}
      >
        <span className="text-xs font-mono" style={{ color: 'var(--color-solar-text-muted)' }}>JSON</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCollapsed((v) => !v)}
            className="text-xs px-2 py-0.5 rounded transition-colors hover:bg-white/5"
            style={{ color: 'var(--color-solar-text-muted)' }}
          >
            {isCollapsed ? 'Expand' : 'Collapse'}
          </button>
          <button
            onClick={handleCopy}
            className="text-xs px-2 py-0.5 rounded transition-colors hover:bg-white/5"
            style={{ color: copied ? '#22C55E' : 'var(--color-solar-text-muted)' }}
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div
          className="overflow-auto p-3 text-xs font-mono leading-relaxed"
          style={{
            maxHeight,
            color: 'var(--color-solar-text-secondary)',
            background: 'var(--color-solar-bg)',
          }}
        >
          {colorizeJson(jsonStr)}
        </div>
      )}
    </div>
  );
}
