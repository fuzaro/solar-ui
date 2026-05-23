export const PLANETS = ['sun','moon','mercury','venus','mars','saturn','neptune','pluto','themis','jupiter'] as const;
export type PlanetId = typeof PLANETS[number];

export const PLANET_META: Record<PlanetId, { label: string; port: number; description: string; color: string; glow: string }> = {
  sun:      { label: 'Sun',      port: 8007, description: 'Orchestrator',       color: '#F59E0B', glow: 'rgba(245,158,11,0.2)'  },
  moon:     { label: 'Moon',     port: 8003, description: 'Memory & Audit',     color: '#6366F1', glow: 'rgba(99,102,241,0.2)'  },
  mercury:  { label: 'Mercury',  port: 8005, description: 'Messaging',          color: '#06B6D4', glow: 'rgba(6,182,212,0.2)'   },
  venus:    { label: 'Venus',    port: 8000, description: 'API Gateway',        color: '#F43F5E', glow: 'rgba(244,63,94,0.2)'   },
  mars:     { label: 'Mars',     port: 8002, description: 'Execution Engine',   color: '#EA580C', glow: 'rgba(234,88,12,0.2)'   },
  saturn:   { label: 'Saturn',   port: 8006, description: 'Identity & Billing', color: '#D97706', glow: 'rgba(217,119,6,0.2)'   },
  neptune:  { label: 'Neptune',  port: 8001, description: 'Inference Gateway',  color: '#3B82F6', glow: 'rgba(59,130,246,0.2)'  },
  pluto:    { label: 'Pluto',    port: 8008, description: 'Security & AuthZ',   color: '#64748B', glow: 'rgba(100,116,139,0.2)' },
  themis:   { label: 'Themis',   port: 8009, description: 'Judgment Plane',     color: '#8B5CF6', glow: 'rgba(139,92,246,0.2)'  },
  jupiter:  { label: 'Jupiter',  port: 0,    description: 'Scaling (deferred)', color: '#10B981', glow: 'rgba(16,185,129,0.2)'  },
};

export const AURA_BANDS = ['green','yellow','orange','red','violet','dim'] as const;
export type AuraBand = typeof AURA_BANDS[number];

export const AURA_META: Record<AuraBand, { label: string; color: string }> = {
  green:  { label: 'Healthy',   color: '#22C55E' },
  yellow: { label: 'Warning',   color: '#EAB308' },
  orange: { label: 'Alert',     color: '#F97316' },
  red:    { label: 'Critical',  color: '#EF4444' },
  violet: { label: 'Deviation', color: '#8B5CF6' },
  dim:    { label: 'No Data',   color: '#6B7280' },
};

export const EXECUTION_STEPS = [
  { id: 1, name: 'INTAKE',       description: 'Validate & classify request' },
  { id: 2, name: 'ADEQUATION',   description: 'Select agent, model & budget' },
  { id: 3, name: 'PREPARATION',  description: 'Provision container & inject secrets' },
  { id: 4, name: 'EXECUTION',    description: 'Agent runs in container' },
  { id: 5, name: 'EVALUATION',   description: 'Quality gates check output' },
  { id: 6, name: 'DELIVERY',     description: 'Return result to caller' },
  { id: 7, name: 'AUDIT',        description: 'Write immutable audit record' },
] as const;
