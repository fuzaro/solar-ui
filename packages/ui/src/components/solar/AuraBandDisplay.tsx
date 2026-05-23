import React from 'react';
import clsx from 'clsx';
import type { AuraBand } from '../../tokens/index';
import { AURA_META } from '../../tokens/index';

interface AuraBandDisplayProps {
  bands: Partial<Record<AuraBand, number>>;
  axes: string[];
  title?: string;
  className?: string;
}

export function AuraBandDisplay({ bands, axes, title, className }: AuraBandDisplayProps) {
  // Map axis index to band keys
  const auraBandKeys: AuraBand[] = ['green', 'yellow', 'orange', 'red', 'violet', 'dim'];

  // Build per-axis display: for each axis, find the band with highest value
  const axisResults = axes.map((axis, idx) => {
    // Determine which band this axis maps to by looking at bands record
    const dominantBand: AuraBand = auraBandKeys.reduce<AuraBand>(
      (best, band) => {
        const bVal = bands[band] ?? 0;
        const bestVal = bands[best] ?? 0;
        return bVal > bestVal ? band : best;
      },
      'dim'
    );
    return { axis, band: dominantBand };
  });

  return (
    <div className={clsx('flex flex-col gap-2', className)}>
      {title && (
        <h4 className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-solar-text-muted)' }}>
          {title}
        </h4>
      )}

      {/* Band legend */}
      <div className="flex flex-wrap gap-2 mb-1">
        {Object.entries(bands).map(([band, value]) => {
          if (value === undefined || value === 0) return null;
          const meta = AURA_META[band as AuraBand];
          const pct = Math.round((value ?? 0) * 100);
          return (
            <div
              key={band}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md"
              style={{
                background: `${meta.color}12`,
                border: `1px solid ${meta.color}33`,
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: meta.color }} />
              <span className="text-xs font-medium" style={{ color: meta.color }}>
                {meta.label}
              </span>
              <span className="text-xs font-mono" style={{ color: 'var(--color-solar-text-muted)' }}>
                {pct}%
              </span>
            </div>
          );
        })}
      </div>

      {/* Per-axis pills */}
      {axes.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {axes.map((axis) => {
            // Find band entry for this axis key
            const bandKey = axis.toLowerCase().replace(/[^a-z]/g, '') as AuraBand;
            const activeBand: AuraBand = auraBandKeys.includes(bandKey)
              ? bandKey
              : (Object.entries(bands).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))[0]?.[0] as AuraBand) ?? 'dim';
            const meta = AURA_META[activeBand];

            return (
              <span
                key={axis}
                className="text-xs px-2 py-0.5 rounded-full font-mono"
                style={{
                  background: `${meta.color}14`,
                  color: meta.color,
                  border: `1px solid ${meta.color}33`,
                }}
              >
                {axis}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
