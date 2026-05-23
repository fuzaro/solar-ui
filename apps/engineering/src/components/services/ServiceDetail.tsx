'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  PageHeader,
  PlanetBadge,
  StatusDot,
  Tabs,
  JsonViewer,
  Button,
  Badge,
  Input,
  Switch,
  Select,
  ConfirmDialog,
  PLANET_META,
  AURA_META,
  type PlanetId,
} from '@solar/ui';
import { createSolarClients, type HealthResponse } from '@solar/api';
import { Save, RotateCcw, Shield, Settings, Activity } from 'lucide-react';

// ─── Solar clients ────────────────────────────────────────────────────────────

const solar = createSolarClients({
  venus: import.meta.env.PUBLIC_VENUS_URL || 'http://localhost:8000',
  neptune: import.meta.env.PUBLIC_NEPTUNE_URL || 'http://localhost:8001',
  mars: import.meta.env.PUBLIC_MARS_URL || 'http://localhost:8002',
  moon: import.meta.env.PUBLIC_MOON_URL || 'http://localhost:8003',
  saturn: import.meta.env.PUBLIC_SATURN_URL || 'http://localhost:8006',
  sun: import.meta.env.PUBLIC_SUN_URL || 'http://localhost:8007',
  pluto: import.meta.env.PUBLIC_PLUTO_URL || 'http://localhost:8008',
  themis: import.meta.env.PUBLIC_THEMIS_URL || 'http://localhost:8009',
});

// ─── Environment Variable Definitions ─────────────────────────────────────────

interface EnvVarDef {
  name: string;
  category: string;
  type: 'string' | 'int' | 'bool' | 'enum';
  default: string;
  description: string;
  options?: string[];
}

const SERVICE_ENV_VARS: Record<string, EnvVarDef[]> = {
  venus: [
    { name: 'VENUS_VERSION', category: 'General', type: 'string', default: '0.1.0', description: 'Service version' },
    { name: 'VENUS_LOG_LEVEL', category: 'General', type: 'enum', default: 'info', description: 'Log level', options: ['debug', 'info', 'warning', 'error'] },
    { name: 'VENUS_API_KEY', category: 'Connection', type: 'string', default: '', description: 'API authentication key' },
    { name: 'VENUS_IDEMPOTENCY_TTL', category: 'Timeouts', type: 'int', default: '3600', description: 'Idempotency key TTL in seconds' },
    { name: 'VENUS_TASK_TTL', category: 'Timeouts', type: 'int', default: '86400', description: 'Task TTL in seconds' },
    { name: 'VENUS_SUN_URL', category: 'Peers', type: 'string', default: 'http://sun:8007', description: 'Sun orchestrator URL' },
    { name: 'VENUS_SATURN_ENABLED', category: 'Feature Flags', type: 'bool', default: 'true', description: 'Enable Saturn identity checks' },
    { name: 'VENUS_SATURN_TIMEOUT_S', category: 'Timeouts', type: 'int', default: '5', description: 'Saturn call timeout' },
    { name: 'VENUS_SYNC_ALWAYS_DOWNGRADE', category: 'Feature Flags', type: 'bool', default: 'false', description: 'Always downgrade sync tasks' },
    { name: 'VENUS_SUN_STUB_DELAY_MS', category: 'Limits', type: 'int', default: '0', description: 'Stub delay for Sun calls' },
    { name: 'VENUS_SUN_STUB_FAILURE_RATE', category: 'Limits', type: 'int', default: '0', description: 'Stub failure rate percentage' },
  ],
  neptune: [
    { name: 'NEPTUNE_VERSION', category: 'General', type: 'string', default: '0.1.0', description: 'Service version' },
    { name: 'NEPTUNE_LOG_LEVEL', category: 'General', type: 'enum', default: 'info', description: 'Log level', options: ['debug', 'info', 'warning', 'error'] },
    { name: 'NEPTUNE_TOKEN_REQUIRED', category: 'Feature Flags', type: 'bool', default: 'true', description: 'Require auth token' },
    { name: 'NEPTUNE_OLLAMA_TIMEOUT', category: 'Timeouts', type: 'int', default: '120', description: 'Ollama inference timeout seconds' },
  ],
  mars: [
    { name: 'MARS_VERSION', category: 'General', type: 'string', default: '0.1.0', description: 'Service version' },
    { name: 'MARS_LOG_LEVEL', category: 'General', type: 'enum', default: 'info', description: 'Log level', options: ['debug', 'info', 'warning', 'error'] },
    { name: 'MARS_PORT', category: 'General', type: 'int', default: '8002', description: 'Service port' },
    { name: 'MARS_TOKEN_REQUIRED', category: 'Feature Flags', type: 'bool', default: 'true', description: 'Require auth token' },
    { name: 'NOMAD_ADDR', category: 'Connection', type: 'string', default: 'http://nomad:4646', description: 'Nomad cluster address' },
    { name: 'NOMAD_DC', category: 'Connection', type: 'string', default: 'dc1', description: 'Nomad datacenter' },
    { name: 'NOMAD_TOKEN', category: 'Connection', type: 'string', default: '', description: 'Nomad ACL token' },
    { name: 'VENUS_URL', category: 'Peers', type: 'string', default: 'http://venus:8000', description: 'Venus gateway URL' },
    { name: 'MARS_SERVICE_TOKEN', category: 'Connection', type: 'string', default: '', description: 'Mars service auth token' },
    { name: 'SOLAR_NEPTUNE_URL', category: 'Peers', type: 'string', default: 'http://neptune:8001', description: 'Neptune URL' },
    { name: 'SOLAR_MOON_URL', category: 'Peers', type: 'string', default: 'http://moon:8003', description: 'Moon URL' },
    { name: 'SOLAR_SATURN_URL', category: 'Peers', type: 'string', default: 'http://saturn:8006', description: 'Saturn URL' },
    { name: 'SOLAR_AGENT_HTTP_TIMEOUT', category: 'Timeouts', type: 'int', default: '300', description: 'Agent HTTP timeout seconds' },
    { name: 'SATURN_AUDIT_TIMEOUT_S', category: 'Timeouts', type: 'int', default: '5', description: 'Saturn audit timeout' },
    { name: 'OUTPUT_BASE', category: 'Limits', type: 'string', default: '/tmp/output', description: 'Output base path' },
    { name: 'BUDGET_POLL_INTERVAL_S', category: 'Timeouts', type: 'int', default: '10', description: 'Budget poll interval seconds' },
    { name: 'OUTPUT_MAX_SIZE_MB', category: 'Limits', type: 'int', default: '50', description: 'Max output size MB' },
    { name: 'TERMINATION_GRACE_S', category: 'Timeouts', type: 'int', default: '30', description: 'Termination grace period' },
    { name: 'CALLBACK_MAX_ATTEMPTS', category: 'Limits', type: 'int', default: '3', description: 'Max callback retry attempts' },
  ],
  moon: [
    { name: 'MOON_VERSION', category: 'General', type: 'string', default: '0.1.0', description: 'Service version' },
    { name: 'MOON_LOG_LEVEL', category: 'General', type: 'enum', default: 'info', description: 'Log level', options: ['debug', 'info', 'warning', 'error'] },
    { name: 'MOON_PORT', category: 'General', type: 'int', default: '8003', description: 'Service port' },
    { name: 'MOON_TOKEN_REQUIRED', category: 'Feature Flags', type: 'bool', default: 'true', description: 'Require auth token' },
    { name: 'MOON_LOG_BATCH_LIMIT', category: 'Limits', type: 'int', default: '100', description: 'Log batch limit' },
    { name: 'MOON_CLOCK_DRIFT_TOLERANCE_S', category: 'Timeouts', type: 'int', default: '5', description: 'Clock drift tolerance' },
    { name: 'MOON_SESSION_MAX_TTL_HOURS', category: 'Timeouts', type: 'int', default: '24', description: 'Session max TTL hours' },
    { name: 'PLUTO_URL', category: 'Peers', type: 'string', default: 'http://pluto:8008', description: 'Pluto URL' },
    { name: 'PLUTO_REAL', category: 'Feature Flags', type: 'bool', default: 'false', description: 'Use real Pluto (vs stub)' },
    { name: 'OLLAMA_URL', category: 'Connection', type: 'string', default: 'http://ollama:11434', description: 'Ollama URL' },
    { name: 'OLLAMA_EMBED_MODEL', category: 'Connection', type: 'string', default: 'nomic-embed-text', description: 'Embedding model' },
    { name: 'EMBED_TIMEOUT_S', category: 'Timeouts', type: 'int', default: '30', description: 'Embedding timeout' },
    { name: 'MOON_HNSW_EF_SEARCH', category: 'Limits', type: 'int', default: '64', description: 'HNSW ef_search param' },
    { name: 'MOON_SWEEPER_INTERVAL_S', category: 'Timeouts', type: 'int', default: '300', description: 'Sweeper interval seconds' },
  ],
  saturn: [
    { name: 'SATURN_VERSION', category: 'General', type: 'string', default: '0.1.0', description: 'Service version' },
    { name: 'SATURN_LOG_LEVEL', category: 'General', type: 'enum', default: 'info', description: 'Log level', options: ['debug', 'info', 'warning', 'error'] },
    { name: 'SATURN_PORT', category: 'General', type: 'int', default: '8006', description: 'Service port' },
    { name: 'SOLAR_MOON_URL', category: 'Peers', type: 'string', default: 'http://moon:8003', description: 'Moon URL' },
    { name: 'SATURN_MOON_AUDIT_TIMEOUT_S', category: 'Timeouts', type: 'int', default: '5', description: 'Moon audit timeout' },
    { name: 'SATURN_ADMIN_TOKEN', category: 'Connection', type: 'string', default: '', description: 'Admin auth token' },
  ],
  sun: [
    { name: 'SUN_VERSION', category: 'General', type: 'string', default: '0.1.0', description: 'Service version' },
    { name: 'SUN_LOG_LEVEL', category: 'General', type: 'enum', default: 'info', description: 'Log level', options: ['debug', 'info', 'warning', 'error'] },
    { name: 'SUN_PORT', category: 'General', type: 'int', default: '8007', description: 'Service port' },
    { name: 'SUN_MOON_URL', category: 'Peers', type: 'string', default: 'http://moon:8003', description: 'Moon URL' },
    { name: 'SUN_SATURN_URL', category: 'Peers', type: 'string', default: 'http://saturn:8006', description: 'Saturn URL' },
    { name: 'SUN_MARS_URL', category: 'Peers', type: 'string', default: 'http://mars:8002', description: 'Mars URL' },
    { name: 'SUN_NEPTUNE_URL', category: 'Peers', type: 'string', default: 'http://neptune:8001', description: 'Neptune URL' },
    { name: 'SUN_PLUTO_URL', category: 'Peers', type: 'string', default: 'http://pluto:8008', description: 'Pluto URL' },
    { name: 'SUN_MERCURY_URL', category: 'Peers', type: 'string', default: 'http://mercury:8005', description: 'Mercury URL' },
    { name: 'SUN_URL', category: 'Peers', type: 'string', default: 'http://sun:8007', description: 'Self URL' },
    { name: 'SUN_ADEQUATION_MIN_SCORE', category: 'Limits', type: 'int', default: '50', description: 'Min adequation score' },
    { name: 'SUN_SYNC_THRESHOLD_MS', category: 'Timeouts', type: 'int', default: '5000', description: 'Sync threshold ms' },
    { name: 'SUN_MARS_POLL_INTERVAL_S', category: 'Timeouts', type: 'int', default: '2', description: 'Mars poll interval' },
    { name: 'SUN_MARS_POLL_TIMEOUT_S', category: 'Timeouts', type: 'int', default: '300', description: 'Mars poll timeout' },
    { name: 'SUN_DEFAULT_AGENT_ID', category: 'Limits', type: 'string', default: 'agent-nano-v1', description: 'Default agent ID' },
    { name: 'SUN_DEFAULT_AGENT_VERSION', category: 'Limits', type: 'string', default: '1.0.0', description: 'Default agent version' },
    { name: 'SUN_DEFAULT_MODEL_ID', category: 'Limits', type: 'string', default: 'qwen2.5:7b', description: 'Default model ID' },
    { name: 'SUN_DEFAULT_IMAGE_REGISTRY', category: 'Connection', type: 'string', default: 'registry.solar', description: 'Image registry' },
    { name: 'SUN_BATCH_PARTITION_THRESHOLD', category: 'Limits', type: 'int', default: '10', description: 'Batch partition threshold' },
    { name: 'SUN_BATCH_MAX_PARALLELISM', category: 'Limits', type: 'int', default: '5', description: 'Max batch parallelism' },
    { name: 'SUN_LONG_RUNNING_LATENCY_MS', category: 'Timeouts', type: 'int', default: '30000', description: 'Long-running latency threshold' },
    { name: 'THEMIS_SHADOW_ENABLED', category: 'Feature Flags', type: 'bool', default: 'false', description: 'Enable Themis shadow mode' },
    { name: 'THEMIS_TIMEOUT_MS', category: 'Timeouts', type: 'int', default: '5000', description: 'Themis timeout ms' },
    { name: 'THEMIS_BLOCKING_TIMEOUT_MS', category: 'Timeouts', type: 'int', default: '10000', description: 'Themis blocking timeout' },
    { name: 'THEMIS_CIRCUIT_BREAKER_FAILURE_THRESHOLD', category: 'Limits', type: 'int', default: '5', description: 'Circuit breaker threshold' },
    { name: 'THEMIS_CIRCUIT_BREAKER_OPEN_DURATION_MS', category: 'Timeouts', type: 'int', default: '30000', description: 'Circuit breaker open duration' },
    { name: 'THEMIS_PICK_MODEL_ENABLED', category: 'Feature Flags', type: 'bool', default: 'false', description: 'Enable Themis model picking' },
    { name: 'THEMIS_QUALITY_GATES_ENABLED', category: 'Feature Flags', type: 'bool', default: 'false', description: 'Enable quality gates' },
    { name: 'THEMIS_TIER_ESCALATION_ENABLED', category: 'Feature Flags', type: 'bool', default: 'false', description: 'Enable tier escalation' },
    { name: 'THEMIS_RESOURCE_HEALTH_ENABLED', category: 'Feature Flags', type: 'bool', default: 'false', description: 'Enable resource health checks' },
  ],
  pluto: [
    { name: 'PLUTO_VERSION', category: 'General', type: 'string', default: '0.1.0', description: 'Service version' },
    { name: 'PLUTO_LOG_LEVEL', category: 'General', type: 'enum', default: 'info', description: 'Log level', options: ['debug', 'info', 'warning', 'error'] },
    { name: 'PLUTO_PORT', category: 'General', type: 'int', default: '8008', description: 'Service port' },
    { name: 'PLUTO_VAULT_ADDR', category: 'Connection', type: 'string', default: 'http://vault:8200', description: 'Vault address' },
    { name: 'PLUTO_VAULT_TOKEN', category: 'Connection', type: 'string', default: '', description: 'Vault token' },
    { name: 'PLUTO_VAULT_TOKEN_FILE', category: 'Connection', type: 'string', default: '', description: 'Vault token file path' },
    { name: 'PLUTO_VAULT_SKIP_VERIFY', category: 'Feature Flags', type: 'bool', default: 'false', description: 'Skip Vault TLS verify' },
    { name: 'PLUTO_EPHEMERAL_KEY_NAME', category: 'Connection', type: 'string', default: 'solar-ephemeral', description: 'Ephemeral key name' },
    { name: 'PLUTO_OPENFGA_HTTP_URL', category: 'Connection', type: 'string', default: 'http://openfga:8080', description: 'OpenFGA HTTP URL' },
    { name: 'PLUTO_OPENFGA_STORE_ID', category: 'Connection', type: 'string', default: '', description: 'OpenFGA store ID' },
    { name: 'PLUTO_OPENFGA_MODEL_ID', category: 'Connection', type: 'string', default: '', description: 'OpenFGA model ID' },
    { name: 'PLUTO_TOKEN_TTL_SECONDS', category: 'Timeouts', type: 'int', default: '3600', description: 'Token TTL seconds' },
    { name: 'PLUTO_VALIDATE_CACHE_SECONDS', category: 'Timeouts', type: 'int', default: '60', description: 'Validate cache TTL' },
    { name: 'PLUTO_JWT_PRIVATE_KEY_PEM', category: 'Connection', type: 'string', default: '', description: 'JWT private key PEM' },
    { name: 'PLUTO_LIST_OBJECTS_MAX', category: 'Limits', type: 'int', default: '100', description: 'Max objects in list' },
    { name: 'PLUTO_ANOMALY_DENIAL_THRESHOLD', category: 'Limits', type: 'int', default: '10', description: 'Anomaly denial threshold' },
    { name: 'PLUTO_ANOMALY_WINDOW_SECONDS', category: 'Timeouts', type: 'int', default: '300', description: 'Anomaly window seconds' },
  ],
  themis: [
    { name: 'THEMIS_VERSION', category: 'General', type: 'string', default: '0.1.0', description: 'Service version' },
    { name: 'THEMIS_LOG_LEVEL', category: 'General', type: 'enum', default: 'info', description: 'Log level', options: ['debug', 'info', 'warning', 'error'] },
    { name: 'THEMIS_PORT', category: 'General', type: 'int', default: '8009', description: 'Service port' },
    { name: 'THEMIS_NEPTUNE_URL', category: 'Peers', type: 'string', default: 'http://neptune:8001', description: 'Neptune URL' },
    { name: 'THEMIS_PLUTO_URL', category: 'Peers', type: 'string', default: 'http://pluto:8008', description: 'Pluto URL' },
    { name: 'THEMIS_SUN_URL', category: 'Peers', type: 'string', default: 'http://sun:8007', description: 'Sun URL' },
    { name: 'THEMIS_MOON_URL', category: 'Peers', type: 'string', default: 'http://moon:8003', description: 'Moon URL' },
    { name: 'THEMIS_DEFAULT_AURA_ENVELOPE_VERSION', category: 'General', type: 'string', default: '1.0', description: 'Default AURA envelope version' },
    { name: 'THEMIS_DEFAULT_HYDE_VERSION', category: 'General', type: 'string', default: '1.0', description: 'Default HYDE version' },
    { name: 'THEMIS_DEFAULT_FINGERPRINT_VERSION', category: 'General', type: 'string', default: '1.0', description: 'Default fingerprint version' },
    { name: 'THEMIS_RECOMMEND_DEADLINE_MS', category: 'Timeouts', type: 'int', default: '5000', description: 'Recommend deadline ms' },
    { name: 'THEMIS_HYDE_TIMEOUT_MS', category: 'Timeouts', type: 'int', default: '10000', description: 'HYDE timeout ms' },
    { name: 'THEMIS_HYDE_MODEL', category: 'Connection', type: 'string', default: 'qwen2.5:7b', description: 'HYDE model ID' },
    { name: 'THEMIS_VERDICT_CACHE_TTL_S', category: 'Timeouts', type: 'int', default: '300', description: 'Verdict cache TTL' },
    { name: 'THEMIS_DISTRIBUTION_CACHE_TTL_S', category: 'Timeouts', type: 'int', default: '600', description: 'Distribution cache TTL' },
    { name: 'THEMIS_HYDE_CACHE_MAX_ROWS', category: 'Limits', type: 'int', default: '1000', description: 'HYDE cache max rows' },
    { name: 'THEMIS_JWT_AUDIENCE', category: 'Connection', type: 'string', default: 'solar-platform', description: 'JWT audience' },
    { name: 'THEMIS_JWT_PUBLIC_KEY_PATH', category: 'Connection', type: 'string', default: '', description: 'JWT public key path' },
    { name: 'THEMIS_AUTH_ENABLED', category: 'Feature Flags', type: 'bool', default: 'true', description: 'Enable authentication' },
    { name: 'THEMIS_KIN_SIMILARITY_THRESHOLD', category: 'Limits', type: 'int', default: '80', description: 'Kin similarity threshold' },
    { name: 'THEMIS_KIN_MIN_COUNT', category: 'Limits', type: 'int', default: '3', description: 'Kin minimum count' },
    { name: 'THEMIS_KIN_WINDOW_DAYS', category: 'Limits', type: 'int', default: '30', description: 'Kin window days' },
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const healthClients: Record<string, () => Promise<HealthResponse>> = {
  venus: solar.venus.health,
  neptune: solar.neptune.health,
  mars: solar.mars.health,
  moon: solar.moon.health,
  saturn: solar.saturn.health,
  sun: solar.sun.health,
  pluto: solar.pluto.health,
  themis: solar.themis.health,
};

function statusToBand(status?: string) {
  switch (status) {
    case 'healthy': return 'green';
    case 'degraded': return 'yellow';
    case 'unreachable': return 'red';
    case 'maintenance': return 'orange';
    default: return 'dim';
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

interface ServiceDetailProps {
  planet?: PlanetId;
}

export function ServiceDetail({ planet: initialPlanet }: ServiceDetailProps) {
  const [selectedPlanet, setSelectedPlanet] = useState<PlanetId>(initialPlanet || 'venus');
  const [activeTab, setActiveTab] = useState('health');
  const [editedVars, setEditedVars] = useState<Record<string, string>>({});
  const [confirmState, setConfirmState] = useState(false);

  const { data: health, isLoading } = useQuery({
    queryKey: ['service-health', selectedPlanet],
    queryFn: () => healthClients[selectedPlanet](),
    refetchInterval: 10_000,
  });

  const envVars = SERVICE_ENV_VARS[selectedPlanet] || [];
  const categories = useMemo(() => [...new Set(envVars.map((v) => v.category))], [selectedPlanet]);
  const changedVars = Object.keys(editedVars);

  const band = statusToBand(health?.status);

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Planet selector */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
        {(['venus', 'neptune', 'mars', 'moon', 'saturn', 'sun', 'pluto', 'themis'] as PlanetId[]).map((p) => (
          <button
            key={p}
            onClick={() => { setSelectedPlanet(p); setEditedVars({}); setActiveTab('health'); }}
            style={{
              background: selectedPlanet === p ? PLANET_META[p].glow : 'var(--color-solar-card)',
              border: `1px solid ${selectedPlanet === p ? PLANET_META[p].color : 'var(--color-solar-border)'}`,
              borderRadius: 'var(--radius-md)',
              padding: '0.375rem 0.75rem',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            <PlanetBadge planet={p} size="sm" />
          </button>
        ))}
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <PlanetBadge planet={selectedPlanet} size="lg" showPort />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-solar-text-muted)', fontFamily: 'var(--font-mono)' }}>
            v{health?.version ?? '—'} • port {PLANET_META[selectedPlanet].port}
          </div>
        </div>
        <StatusDot status={band as any} pulse={band === 'green'} label={AURA_META[band as keyof typeof AURA_META]?.label} />
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={setActiveTab}
        items={[
          { value: 'health', label: 'Health' },
          { value: 'config', label: 'Configuration' },
          { value: 'state', label: 'Module State' },
        ]}
      />

      {/* Health Tab */}
      {activeTab === 'health' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Health JSON */}
          <div style={{ background: 'var(--color-solar-card)', border: '1px solid var(--color-solar-border)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
            <h4 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-solar-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
              Full Health Response
            </h4>
            {health ? <JsonViewer data={health} collapsed={false} /> : <div style={{ color: 'var(--color-solar-text-muted)', fontSize: '0.875rem' }}>Loading...</div>}
          </div>

          {/* Dependency health */}
          {health?.dependencies && (
            <div style={{ background: 'var(--color-solar-card)', border: '1px solid var(--color-solar-border)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
              <h4 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-solar-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                Dependency Health
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                {Object.entries(health.dependencies).map(([dep, status]) => (
                  <div key={dep} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem', background: 'var(--color-solar-surface)', borderRadius: 'var(--radius-sm)' }}>
                    <code style={{ fontSize: '0.8125rem', fontFamily: 'var(--font-mono)', color: 'var(--color-solar-text-secondary)' }}>{dep}</code>
                    <StatusDot status={statusToBand(status) as any} label={status} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Health timeline placeholder */}
          <div style={{ background: 'var(--color-solar-card)', border: '1px solid var(--color-solar-border)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
            <h4 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-solar-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
              Health History (24h)
            </h4>
            <div style={{ display: 'flex', height: '2rem', borderRadius: 'var(--radius-sm)', overflow: 'hidden', gap: '1px' }}>
              {Array.from({ length: 48 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    background: i > 44 ? '#EF4444' : i > 40 ? '#EAB308' : '#22C55E',
                    opacity: 0.8,
                  }}
                />
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
              <span style={{ fontSize: '0.625rem', color: 'var(--color-solar-text-muted)' }}>24h ago</span>
              <span style={{ fontSize: '0.625rem', color: 'var(--color-solar-text-muted)' }}>now</span>
            </div>
          </div>
        </div>
      )}

      {/* Configuration Tab */}
      {activeTab === 'config' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {categories.map((cat) => (
            <div key={cat} style={{ background: 'var(--color-solar-card)', border: '1px solid var(--color-solar-border)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
              <h4 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-solar-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                {cat}
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {envVars.filter((v) => v.category === cat).map((v) => (
                  <div key={v.name} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.75rem', alignItems: 'center', padding: '0.5rem', background: 'var(--color-solar-surface)', borderRadius: 'var(--radius-sm)' }}>
                    <div>
                      <code style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--color-solar-text-primary)' }}>{v.name}</code>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--color-solar-text-muted)', marginTop: '0.125rem' }}>{v.description}</div>
                    </div>
                    <div>
                      {v.type === 'bool' ? (
                        <Switch
                          checked={(editedVars[v.name] ?? v.default) === 'true'}
                          onChange={(checked) => setEditedVars({ ...editedVars, [v.name]: String(checked) })}
                        />
                      ) : v.type === 'enum' ? (
                        <Select
                          value={editedVars[v.name] ?? v.default}
                          onChange={(e) => setEditedVars({ ...editedVars, [v.name]: e.target.value })}
                          options={(v.options || []).map((o) => ({ value: o, label: o }))}
                        />
                      ) : (
                        <Input
                          value={editedVars[v.name] ?? v.default}
                          onChange={(e) => setEditedVars({ ...editedVars, [v.name]: e.target.value })}
                          style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}
                        />
                      )}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => { const next = { ...editedVars }; delete next[v.name]; setEditedVars(next); }}>
                      <RotateCcw size={12} />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {changedVars.length > 0 && (
            <div style={{ position: 'sticky', bottom: '1rem', background: 'var(--color-solar-surface)', border: '1px solid var(--color-solar-border)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.8125rem', color: 'var(--color-solar-text-secondary)' }}>
                {changedVars.length} variable(s) changed
              </span>
              <Button variant="primary" size="sm" onClick={() => setConfirmState(true)}>
                <Save size={14} /> Apply Changes
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Module State Tab */}
      {activeTab === 'state' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: 'var(--color-solar-card)', border: '1px solid var(--color-solar-border)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
            <h4 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-solar-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
              Current Module State
            </h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <Badge variant="success">Enabled</Badge>
              <span style={{ fontSize: '0.8125rem', color: 'var(--color-solar-text-secondary)' }}>
                Service is fully operational and accepting requests
              </span>
            </div>

            <h4 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-solar-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
              State Transitions
            </h4>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <Button variant="outline" size="sm"><Shield size={12} /> Disable</Button>
              <Button variant="outline" size="sm"><Activity size={12} /> Set Degraded</Button>
              <Button variant="outline" size="sm"><Settings size={12} /> Maintenance Mode</Button>
            </div>
          </div>

          {/* Dependency impact */}
          <div style={{ background: 'var(--color-solar-card)', border: '1px solid var(--color-solar-border)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
            <h4 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-solar-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
              Dependency Impact
            </h4>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-solar-text-secondary)', margin: 0 }}>
              If <strong>{PLANET_META[selectedPlanet].label}</strong> goes offline, the following services will be affected:
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
              {(['venus', 'neptune', 'mars', 'moon', 'saturn', 'sun', 'pluto', 'themis'] as PlanetId[])
                .filter((p) => p !== selectedPlanet)
                .slice(0, 3)
                .map((p) => <PlanetBadge key={p} planet={p} size="sm" />)}
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmState}
        onCancel={() => setConfirmState(false)}
        onConfirm={() => { setConfirmState(false); setEditedVars({}); }}
        title="Apply Configuration Changes"
        description={`Apply ${changedVars.length} variable change(s) to ${PLANET_META[selectedPlanet].label}?`}
        confirmLabel="Apply"
      />
    </div>
  );
}
