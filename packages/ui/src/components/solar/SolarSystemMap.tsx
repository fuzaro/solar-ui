'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { PlanetId, AuraBand } from '../../tokens/index';
import { PLANET_META, AURA_META } from '../../tokens/index';

interface SolarSystemMapProps {
  healthData?: Partial<Record<PlanetId, AuraBand>>;
  onPlanetClick?: (planet: PlanetId) => void;
  width?: number;
  height?: number;
  interactive?: boolean;
  className?: string;
}

interface PlanetConfig {
  id: PlanetId;
  orbitRadius: number;
  orbitSpeed: number;  // radians per second
  size: number;
  initialAngle: number;
}

const PLANET_CONFIGS: PlanetConfig[] = [
  { id: 'mercury',  orbitRadius: 68,  orbitSpeed: 0.6,  size: 6,  initialAngle: 0.3   },
  { id: 'venus',    orbitRadius: 95,  orbitSpeed: 0.45, size: 8,  initialAngle: 1.8   },
  { id: 'mars',     orbitRadius: 124, orbitSpeed: 0.32, size: 8,  initialAngle: 3.5   },
  { id: 'jupiter',  orbitRadius: 155, orbitSpeed: 0.22, size: 11, initialAngle: 0.9   },
  { id: 'saturn',   orbitRadius: 188, orbitSpeed: 0.16, size: 10, initialAngle: 4.2   },
  { id: 'neptune',  orbitRadius: 220, orbitSpeed: 0.10, size: 9,  initialAngle: 2.2   },
  { id: 'moon',     orbitRadius: 250, orbitSpeed: 0.08, size: 8,  initialAngle: 5.0   },
  { id: 'pluto',    orbitRadius: 278, orbitSpeed: 0.05, size: 6,  initialAngle: 1.1   },
  { id: 'themis',   orbitRadius: 306, orbitSpeed: 0.04, size: 8,  initialAngle: 3.0   },
];

// Sun stays at center
const SUN_SIZE = 20;

function getAuraColor(band: AuraBand | undefined): string {
  if (!band) return '#6B7280';
  return AURA_META[band].color;
}

function generateStars(count: number, w: number, h: number): { x: number; y: number; r: number; opacity: number }[] {
  const stars = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.2 + 0.2,
      opacity: Math.random() * 0.6 + 0.1,
    });
  }
  return stars;
}

interface TooltipState {
  planet: PlanetId;
  x: number;
  y: number;
}

export function SolarSystemMap({
  healthData,
  onPlanetClick,
  width = 700,
  height = 520,
  interactive = true,
  className,
}: SolarSystemMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const animRef = useRef<number>(0);
  const anglesRef = useRef<Record<string, number>>(
    Object.fromEntries(PLANET_CONFIGS.map((p) => [p.id, p.initialAngle]))
  );
  const lastTimeRef = useRef<number>(0);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [hoveredPlanet, setHoveredPlanet] = useState<PlanetId | null>(null);

  const cx = width / 2;
  const cy = height / 2;

  const starsRef = useRef(generateStars(120, width, height));

  const updatePlanetPositions = useCallback((timestamp: number) => {
    const dt = lastTimeRef.current ? (timestamp - lastTimeRef.current) / 1000 : 0;
    lastTimeRef.current = timestamp;

    const svg = svgRef.current;
    if (!svg) return;

    PLANET_CONFIGS.forEach((planet) => {
      anglesRef.current[planet.id] = (anglesRef.current[planet.id] + planet.orbitSpeed * dt) % (Math.PI * 2);
      const angle = anglesRef.current[planet.id];
      const x = cx + Math.cos(angle) * planet.orbitRadius;
      const y = cy + Math.sin(angle) * (planet.orbitRadius * 0.38); // elliptical

      const group = svg.querySelector(`[data-planet="${planet.id}"]`) as SVGGElement;
      if (group) {
        group.setAttribute('transform', `translate(${x}, ${y})`);
      }
    });

    animRef.current = requestAnimationFrame(updatePlanetPositions);
  }, [cx, cy]);

  useEffect(() => {
    animRef.current = requestAnimationFrame(updatePlanetPositions);
    return () => cancelAnimationFrame(animRef.current);
  }, [updatePlanetPositions]);

  function handlePlanetMouseEnter(planet: PlanetId, e: React.MouseEvent<SVGGElement>) {
    const rect = svgRef.current!.getBoundingClientRect();
    const svgX = e.clientX - rect.left;
    const svgY = e.clientY - rect.top;
    setHoveredPlanet(planet);
    setTooltip({ planet, x: svgX, y: svgY });
  }

  function handlePlanetMouseLeave() {
    setHoveredPlanet(null);
    setTooltip(null);
  }

  function handlePlanetClick(planet: PlanetId) {
    if (interactive && onPlanetClick) {
      onPlanetClick(planet);
    }
  }

  return (
    <div className={`relative select-none ${className ?? ''}`} style={{ width, height }}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        style={{ background: 'transparent', overflow: 'visible' }}
      >
        {/* Subtle radial gradient background */}
        <defs>
          <radialGradient id="space-gradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#0D0F1A" stopOpacity="1"/>
            <stop offset="100%" stopColor="#08090C" stopOpacity="1"/>
          </radialGradient>
          <radialGradient id="sun-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.4"/>
            <stop offset="60%" stopColor="#F59E0B" stopOpacity="0.1"/>
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0"/>
          </radialGradient>
          {PLANET_CONFIGS.map((p) => {
            const meta = PLANET_META[p.id];
            return (
              <radialGradient key={p.id} id={`planet-glow-${p.id}`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={meta.color} stopOpacity="0.5"/>
                <stop offset="100%" stopColor={meta.color} stopOpacity="0"/>
              </radialGradient>
            );
          })}
          <filter id="glow-filter">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* Background */}
        <rect width={width} height={height} fill="url(#space-gradient)" rx="12"/>

        {/* Stars */}
        {starsRef.current.map((star, i) => (
          <circle
            key={i}
            cx={star.x}
            cy={star.y}
            r={star.r}
            fill="white"
            opacity={star.opacity}
          />
        ))}

        {/* Orbit rings */}
        {PLANET_CONFIGS.map((planet) => (
          <ellipse
            key={`orbit-${planet.id}`}
            cx={cx}
            cy={cy}
            rx={planet.orbitRadius}
            ry={planet.orbitRadius * 0.38}
            fill="none"
            stroke={hoveredPlanet === planet.id ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.04)'}
            strokeWidth={hoveredPlanet === planet.id ? 1 : 0.5}
            strokeDasharray="3 6"
            style={{ transition: 'stroke 0.2s' }}
          />
        ))}

        {/* Sun glow */}
        <circle cx={cx} cy={cy} r={SUN_SIZE * 3} fill="url(#sun-glow)"/>

        {/* Sun */}
        <g transform={`translate(${cx}, ${cy})`}>
          {/* Pulse ring */}
          <circle
            r={SUN_SIZE + 4}
            fill="none"
            stroke="#F59E0B"
            strokeWidth="1.5"
            opacity="0.4"
            style={{ animation: 'solar-pulse 2.5s ease-in-out infinite' }}
          />
          <circle
            r={SUN_SIZE}
            fill="#F59E0B"
            filter="url(#glow-filter)"
          />
          {/* Inner highlight */}
          <circle r={SUN_SIZE * 0.5} cx={-SUN_SIZE * 0.2} cy={-SUN_SIZE * 0.2} fill="#FBBF24" opacity="0.6"/>
          <text
            textAnchor="middle"
            dy={SUN_SIZE + 14}
            fontSize="9"
            fontFamily="var(--font-mono)"
            fill="#F59E0B"
            opacity="0.8"
          >
            SUN
          </text>
        </g>

        {/* Planets (initial positions; JS animation moves them) */}
        {PLANET_CONFIGS.map((planet) => {
          const meta = PLANET_META[planet.id];
          const health = healthData?.[planet.id];
          const auraColor = getAuraColor(health);
          const isHovered = hoveredPlanet === planet.id;

          const initialX = cx + Math.cos(planet.initialAngle) * planet.orbitRadius;
          const initialY = cy + Math.sin(planet.initialAngle) * (planet.orbitRadius * 0.38);

          return (
            <g
              key={planet.id}
              data-planet={planet.id}
              transform={`translate(${initialX}, ${initialY})`}
              onClick={() => handlePlanetClick(planet.id)}
              onMouseEnter={(e) => interactive && handlePlanetMouseEnter(planet.id, e)}
              onMouseLeave={handlePlanetMouseLeave}
              style={{ cursor: interactive ? 'pointer' : 'default' }}
            >
              {/* Health/AURA glow ring */}
              <circle
                r={planet.size + 5}
                fill="none"
                stroke={auraColor}
                strokeWidth={isHovered ? 2 : 1.5}
                opacity={isHovered ? 0.9 : 0.5}
                style={{ transition: 'all 0.2s' }}
              />

              {/* Outer glow */}
              <circle r={planet.size + 8} fill={`url(#planet-glow-${planet.id})`}/>

              {/* Planet body */}
              <circle
                r={isHovered ? planet.size + 1 : planet.size}
                fill={meta.color}
                style={{ transition: 'r 0.15s' }}
              />

              {/* Highlight */}
              <circle
                r={planet.size * 0.4}
                cx={-planet.size * 0.25}
                cy={-planet.size * 0.25}
                fill="white"
                opacity="0.25"
              />

              {/* Label */}
              <text
                textAnchor="middle"
                dy={planet.size + 12}
                fontSize="8"
                fontFamily="var(--font-mono)"
                fill={meta.color}
                opacity={isHovered ? 1 : 0.7}
                style={{ transition: 'opacity 0.2s', userSelect: 'none' }}
              >
                {meta.label.toUpperCase()}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute z-20 pointer-events-none"
          style={{
            left: tooltip.x + 12,
            top: tooltip.y - 10,
            maxWidth: 180,
          }}
        >
          <div
            className="rounded-lg px-3 py-2"
            style={{
              background: 'rgba(25, 29, 43, 0.98)',
              border: `1px solid ${PLANET_META[tooltip.planet].color}55`,
              boxShadow: `0 4px 20px rgba(0,0,0,0.6), 0 0 12px ${PLANET_META[tooltip.planet].glow}`,
              backdropFilter: 'blur(8px)',
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: PLANET_META[tooltip.planet].color }}
              />
              <span
                className="text-xs font-bold font-mono"
                style={{ color: PLANET_META[tooltip.planet].color }}
              >
                {PLANET_META[tooltip.planet].label}
              </span>
            </div>
            <p className="text-xs" style={{ color: 'var(--color-solar-text-secondary)' }}>
              {PLANET_META[tooltip.planet].description}
            </p>
            {PLANET_META[tooltip.planet].port > 0 && (
              <p className="text-xs mt-0.5 font-mono" style={{ color: 'var(--color-solar-text-muted)' }}>
                :{PLANET_META[tooltip.planet].port}
              </p>
            )}
            {healthData?.[tooltip.planet] && (
              <div className="flex items-center gap-1 mt-1.5 pt-1.5" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: getAuraColor(healthData[tooltip.planet]) }}
                />
                <span className="text-xs" style={{ color: getAuraColor(healthData[tooltip.planet]) }}>
                  {AURA_META[healthData[tooltip.planet]!].label}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
