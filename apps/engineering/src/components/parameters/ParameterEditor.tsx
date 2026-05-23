'use client';

import { useState, useMemo } from 'react';
import {
  PageHeader,
  PlanetBadge,
  Button,
  Input,
  Switch,
  Select,
  Badge,
  ConfirmDialog,
  useToast,
  PLANET_META,
  type PlanetId,
} from '@solar/ui';
import { Save, RotateCcw, Sliders } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface EnvVarDef {
  name: string;
  category: string;
  type: 'string' | 'int' | 'bool' | 'enum';
  default: string;
  description: string;
  options?: string[];
}

// ─── Platform Global Variables ────────────────────────────────────────────────

const PLATFORM_GLOBALS: EnvVarDef[] = [
  { name: 'SOLAR_DB_HOST', category: 'Database', type: 'string', default: 'postgres', description: 'Database host' },
  { name: 'SOLAR_DB_PORT', category: 'Database', type: 'int', default: '5432', description: 'Database port' },
  { name: 'SOLAR_DB_NAME', category: 'Database', type: 'string', default: 'solar', description: 'Database name' },
  { name: 'SOLAR_DB_USER', category: 'Database', type: 'string', default: 'solar', description: 'Database user' },
  { name: 'SOLAR_DB_POOL_MIN', category: 'Database', type: 'int', default: '2', description: 'Min pool connections' },
  { name: 'SOLAR_DB_POOL_MAX', category: 'Database', type: 'int', default: '20', description: 'Max pool connections' },
  { name: 'SOLAR_LLM_MODE', category: 'Runtime', type: 'enum', default: 'ollama', description: 'LLM provider mode', options: ['ollama', 'openai_compatible'] },
  { name: 'SOLAR_HTTP_TIMEOUT', category: 'Runtime', type: 'int', default: '30', description: 'Global HTTP timeout (s)' },
  { name: 'SOLAR_TOKEN_BUDGET', category: 'Runtime', type: 'int', default: '10000', description: 'Default token budget' },
  { name: 'SOLAR_TOKEN_BUDGET_MODE', category: 'Runtime', type: 'enum', default: 'hard', description: 'Budget enforcement mode', options: ['hard', 'soft', 'disabled'] },
  { name: 'SOLAR_PRIVILEGE_MODE', category: 'Runtime', type: 'enum', default: 'supervised', description: 'Agent privilege mode', options: ['supervised', 'managed', 'autonomous'] },
  { name: 'SOLAR_SECURITY_LEVEL', category: 'Runtime', type: 'enum', default: 'Internal', description: 'Security classification', options: ['Public', 'Internal', 'Confidential', 'Restricted'] },
  { name: 'SOLAR_MAX_ITERATIONS', category: 'Runtime', type: 'int', default: '50', description: 'Max agent iterations' },
];

// ─── Feature Flags ────────────────────────────────────────────────────────────

const FEATURE_FLAGS: EnvVarDef[] = [
  { name: 'THEMIS_SHADOW_ENABLED', category: 'Themis', type: 'bool', default: 'false', description: 'Enable shadow evaluation mode' },
  { name: 'THEMIS_PICK_MODEL_ENABLED', category: 'Themis', type: 'bool', default: 'false', description: 'Themis picks model for task' },
  { name: 'THEMIS_QUALITY_GATES_ENABLED', category: 'Themis', type: 'bool', default: 'false', description: 'Enable quality gate checks' },
  { name: 'THEMIS_TIER_ESCALATION_ENABLED', category: 'Themis', type: 'bool', default: 'false', description: 'Enable tier escalation' },
  { name: 'THEMIS_RESOURCE_HEALTH_ENABLED', category: 'Themis', type: 'bool', default: 'false', description: 'Enable resource health monitoring' },
  { name: 'VENUS_SATURN_ENABLED', category: 'Venus', type: 'bool', default: 'true', description: 'Venus calls Saturn for auth' },
  { name: 'MOON_TOKEN_REQUIRED', category: 'Moon', type: 'bool', default: 'true', description: 'Require token for Moon API' },
  { name: 'NEPTUNE_TOKEN_REQUIRED', category: 'Neptune', type: 'bool', default: 'true', description: 'Require token for Neptune API' },
  { name: 'MARS_TOKEN_REQUIRED', category: 'Mars', type: 'bool', default: 'true', description: 'Require token for Mars API' },
  { name: 'THEMIS_AUTH_ENABLED', category: 'Themis', type: 'bool', default: 'true', description: 'Enable Themis authentication' },
  { name: 'PLUTO_VAULT_SKIP_VERIFY', category: 'Pluto', type: 'bool', default: 'false', description: 'Skip Vault TLS verification' },
  { name: 'PLUTO_REAL', category: 'Pluto', type: 'bool', default: 'false', description: 'Use real Pluto (not stub)' },
];

// ─── Per-planet config (reused from ServiceDetail) ────────────────────────────

const PLANET_CONFIGS: Record<string, EnvVarDef[]> = {
  venus: [
    { name: 'VENUS_VERSION', category: 'General', type: 'string', default: '0.1.0', description: 'Service version' },
    { name: 'VENUS_LOG_LEVEL', category: 'General', type: 'enum', default: 'info', description: 'Log level', options: ['debug', 'info', 'warning', 'error'] },
    { name: 'VENUS_API_KEY', category: 'Connection', type: 'string', default: '', description: 'API authentication key' },
    { name: 'VENUS_IDEMPOTENCY_TTL', category: 'Timeouts', type: 'int', default: '3600', description: 'Idempotency key TTL seconds' },
    { name: 'VENUS_TASK_TTL', category: 'Timeouts', type: 'int', default: '86400', description: 'Task TTL seconds' },
    { name: 'VENUS_SUN_URL', category: 'Peers', type: 'string', default: 'http://sun:8007', description: 'Sun orchestrator URL' },
    { name: 'VENUS_SATURN_TIMEOUT_S', category: 'Timeouts', type: 'int', default: '5', description: 'Saturn call timeout' },
    { name: 'VENUS_SUN_STUB_DELAY_MS', category: 'Limits', type: 'int', default: '0', description: 'Stub delay for Sun calls' },
    { name: 'VENUS_SUN_STUB_FAILURE_RATE', category: 'Limits', type: 'int', default: '0', description: 'Stub failure rate %' },
  ],
  neptune: [
    { name: 'NEPTUNE_VERSION', category: 'General', type: 'string', default: '0.1.0', description: 'Service version' },
    { name: 'NEPTUNE_LOG_LEVEL', category: 'General', type: 'enum', default: 'info', description: 'Log level', options: ['debug', 'info', 'warning', 'error'] },
    { name: 'NEPTUNE_OLLAMA_TIMEOUT', category: 'Timeouts', type: 'int', default: '120', description: 'Ollama timeout seconds' },
  ],
  mars: [
    { name: 'MARS_VERSION', category: 'General', type: 'string', default: '0.1.0', description: 'Service version' },
    { name: 'MARS_LOG_LEVEL', category: 'General', type: 'enum', default: 'info', description: 'Log level', options: ['debug', 'info', 'warning', 'error'] },
    { name: 'MARS_PORT', category: 'General', type: 'int', default: '8002', description: 'Service port' },
    { name: 'NOMAD_ADDR', category: 'Connection', type: 'string', default: 'http://nomad:4646', description: 'Nomad address' },
    { name: 'NOMAD_DC', category: 'Connection', type: 'string', default: 'dc1', description: 'Nomad datacenter' },
    { name: 'SOLAR_AGENT_HTTP_TIMEOUT', category: 'Timeouts', type: 'int', default: '300', description: 'Agent HTTP timeout' },
    { name: 'OUTPUT_MAX_SIZE_MB', category: 'Limits', type: 'int', default: '50', description: 'Max output size MB' },
    { name: 'TERMINATION_GRACE_S', category: 'Timeouts', type: 'int', default: '30', description: 'Termination grace period' },
    { name: 'CALLBACK_MAX_ATTEMPTS', category: 'Limits', type: 'int', default: '3', description: 'Max callback attempts' },
  ],
  moon: [
    { name: 'MOON_VERSION', category: 'General', type: 'string', default: '0.1.0', description: 'Service version' },
    { name: 'MOON_LOG_LEVEL', category: 'General', type: 'enum', default: 'info', description: 'Log level', options: ['debug', 'info', 'warning', 'error'] },
    { name: 'MOON_LOG_BATCH_LIMIT', category: 'Limits', type: 'int', default: '100', description: 'Log batch limit' },
    { name: 'MOON_CLOCK_DRIFT_TOLERANCE_S', category: 'Timeouts', type: 'int', default: '5', description: 'Clock drift tolerance' },
    { name: 'MOON_SESSION_MAX_TTL_HOURS', category: 'Timeouts', type: 'int', default: '24', description: 'Session max TTL hours' },
    { name: 'OLLAMA_URL', category: 'Connection', type: 'string', default: 'http://ollama:11434', description: 'Ollama URL' },
    { name: 'OLLAMA_EMBED_MODEL', category: 'Connection', type: 'string', default: 'nomic-embed-text', description: 'Embedding model' },
    { name: 'MOON_HNSW_EF_SEARCH', category: 'Limits', type: 'int', default: '64', description: 'HNSW ef_search param' },
  ],
  saturn: [
    { name: 'SATURN_VERSION', category: 'General', type: 'string', default: '0.1.0', description: 'Service version' },
    { name: 'SATURN_LOG_LEVEL', category: 'General', type: 'enum', default: 'info', description: 'Log level', options: ['debug', 'info', 'warning', 'error'] },
    { name: 'SATURN_PORT', category: 'General', type: 'int', default: '8006', description: 'Service port' },
    { name: 'SATURN_MOON_AUDIT_TIMEOUT_S', category: 'Timeouts', type: 'int', default: '5', description: 'Moon audit timeout' },
    { name: 'SATURN_ADMIN_TOKEN', category: 'Connection', type: 'string', default: '', description: 'Admin auth token' },
  ],
  sun: [
    { name: 'SUN_VERSION', category: 'General', type: 'string', default: '0.1.0', description: 'Service version' },
    { name: 'SUN_LOG_LEVEL', category: 'General', type: 'enum', default: 'info', description: 'Log level', options: ['debug', 'info', 'warning', 'error'] },
    { name: 'SUN_ADEQUATION_MIN_SCORE', category: 'Limits', type: 'int', default: '50', description: 'Min adequation score' },
    { name: 'SUN_SYNC_THRESHOLD_MS', category: 'Timeouts', type: 'int', default: '5000', description: 'Sync threshold ms' },
    { name: 'SUN_MARS_POLL_INTERVAL_S', category: 'Timeouts', type: 'int', default: '2', description: 'Mars poll interval' },
    { name: 'SUN_BATCH_MAX_PARALLELISM', category: 'Limits', type: 'int', default: '5', description: 'Max batch parallelism' },
    { name: 'SUN_DEFAULT_AGENT_ID', category: 'Limits', type: 'string', default: 'agent-nano-v1', description: 'Default agent ID' },
    { name: 'SUN_DEFAULT_MODEL_ID', category: 'Limits', type: 'string', default: 'qwen2.5:7b', description: 'Default model ID' },
  ],
  pluto: [
    { name: 'PLUTO_VERSION', category: 'General', type: 'string', default: '0.1.0', description: 'Service version' },
    { name: 'PLUTO_LOG_LEVEL', category: 'General', type: 'enum', default: 'info', description: 'Log level', options: ['debug', 'info', 'warning', 'error'] },
    { name: 'PLUTO_VAULT_ADDR', category: 'Connection', type: 'string', default: 'http://vault:8200', description: 'Vault address' },
    { name: 'PLUTO_OPENFGA_HTTP_URL', category: 'Connection', type: 'string', default: 'http://openfga:8080', description: 'OpenFGA URL' },
    { name: 'PLUTO_TOKEN_TTL_SECONDS', category: 'Timeouts', type: 'int', default: '3600', description: 'Token TTL seconds' },
    { name: 'PLUTO_ANOMALY_DENIAL_THRESHOLD', category: 'Limits', type: 'int', default: '10', description: 'Denial threshold' },
    { name: 'PLUTO_ANOMALY_WINDOW_SECONDS', category: 'Timeouts', type: 'int', default: '300', description: 'Anomaly window' },
  ],
  themis: [
    { name: 'THEMIS_VERSION', category: 'General', type: 'string', default: '0.1.0', description: 'Service version' },
    { name: 'THEMIS_LOG_LEVEL', category: 'General', type: 'enum', default: 'info', description: 'Log level', options: ['debug', 'info', 'warning', 'error'] },
    { name: 'THEMIS_RECOMMEND_DEADLINE_MS', category: 'Timeouts', type: 'int', default: '5000', description: 'Recommend deadline' },
    { name: 'THEMIS_HYDE_TIMEOUT_MS', category: 'Timeouts', type: 'int', default: '10000', description: 'HYDE timeout ms' },
    { name: 'THEMIS_HYDE_MODEL', category: 'Connection', type: 'string', default: 'qwen2.5:7b', description: 'HYDE model' },
    { name: 'THEMIS_VERDICT_CACHE_TTL_S', category: 'Timeouts', type: 'int', default: '300', description: 'Verdict cache TTL' },
    { name: 'THEMIS_KIN_SIMILARITY_THRESHOLD', category: 'Limits', type: 'int', default: '80', description: 'Kin similarity threshold' },
    { name: 'THEMIS_KIN_WINDOW_DAYS', category: 'Limits', type: 'int', default: '30', description: 'Kin window days' },
  ],
};

const PLANET_LIST: PlanetId[] = ['venus', 'neptune', 'mars', 'moon', 'saturn', 'sun', 'pluto', 'themis'];

// ─── Component ────────────────────────────────────────────────────────────────

export function ParameterEditor() {
  const [section, setSection] = useState<'global' | 'flags' | PlanetId>('global');
  const [editedVars, setEditedVars] = useState<Record<string, string>>({});
  const [showConfirm, setShowConfirm] = useState(false);
  const toast = useToast();

  const changedCount = Object.keys(editedVars).length;

  const renderVarRow = (v: EnvVarDef) => (
    <div key={v.name} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 0.6fr auto', gap: '0.75rem', alignItems: 'center', padding: '0.5rem 0.75rem', background: 'var(--color-solar-surface)', borderRadius: 'var(--radius-sm)' }}>
      <div>
        <code style={{ fontSize: '0.6875rem', fontFamily: 'var(--font-mono)', color: 'var(--color-solar-text-primary)', fontWeight: 500 }}>{v.name}</code>
        <div style={{ fontSize: '0.625rem', color: 'var(--color-solar-text-muted)', marginTop: '0.125rem' }}>{v.description}</div>
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
      <div>
        <code style={{ fontSize: '0.625rem', fontFamily: 'var(--font-mono)', color: 'var(--color-solar-text-muted)' }}>
          {v.default || '(empty)'}
        </code>
      </div>
      <Button variant="ghost" size="sm" onClick={() => { const next = { ...editedVars }; delete next[v.name]; setEditedVars(next); }}>
        <RotateCcw size={11} />
      </Button>
    </div>
  );

  const currentVars = section === 'global' ? PLATFORM_GLOBALS : section === 'flags' ? FEATURE_FLAGS : PLANET_CONFIGS[section] || [];
  const categories = useMemo(() => [...new Set(currentVars.map((v) => v.category))], [section]);

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <PageHeader
        title="Parameter Editor"
        description="Manage platform and per-service environment variables, feature flags, and configuration."
      />

      {/* Layout: left selector + right content */}
      <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: '1.5rem' }}>
        {/* Left sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <button
            onClick={() => { setSection('global'); setEditedVars({}); }}
            style={{
              padding: '0.5rem 0.75rem', textAlign: 'left', borderRadius: 'var(--radius-md)', cursor: 'pointer',
              background: section === 'global' ? 'var(--color-solar-card)' : 'transparent',
              border: section === 'global' ? '1px solid var(--color-solar-border)' : '1px solid transparent',
              fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-solar-text-primary)',
            }}
          >
            <Sliders size={14} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'text-bottom' }} />
            Platform Global
          </button>
          <button
            onClick={() => { setSection('flags'); setEditedVars({}); }}
            style={{
              padding: '0.5rem 0.75rem', textAlign: 'left', borderRadius: 'var(--radius-md)', cursor: 'pointer',
              background: section === 'flags' ? 'var(--color-solar-card)' : 'transparent',
              border: section === 'flags' ? '1px solid var(--color-solar-border)' : '1px solid transparent',
              fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-solar-text-primary)',
            }}
          >
            Feature Flags
          </button>
          <div style={{ height: '0.5rem' }} />
          {PLANET_LIST.map((p) => (
            <button
              key={p}
              onClick={() => { setSection(p); setEditedVars({}); }}
              style={{
                padding: '0.375rem 0.5rem', textAlign: 'left', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                background: section === p ? PLANET_META[p].glow : 'transparent',
                border: section === p ? `1px solid ${PLANET_META[p].color}` : '1px solid transparent',
              }}
            >
              <PlanetBadge planet={p} size="sm" />
            </button>
          ))}
        </div>

        {/* Right content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Section header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-solar-text-primary)', margin: 0 }}>
              {section === 'global' ? 'Platform Global' : section === 'flags' ? 'Feature Flags' : PLANET_META[section].label}
            </h3>
            {section !== 'global' && section !== 'flags' && (
              <code style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--color-solar-text-muted)' }}>
                port {PLANET_META[section].port}
              </code>
            )}
          </div>

          {/* Feature flags grid */}
          {section === 'flags' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
              {FEATURE_FLAGS.map((flag) => (
                <div key={flag.name} style={{ background: 'var(--color-solar-card)', border: '1px solid var(--color-solar-border)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <code style={{ fontSize: '0.6875rem', fontFamily: 'var(--font-mono)', color: 'var(--color-solar-text-primary)' }}>{flag.name}</code>
                    <div style={{ fontSize: '0.625rem', color: 'var(--color-solar-text-muted)', marginTop: '0.125rem' }}>{flag.description}</div>
                  </div>
                  <Switch
                    checked={(editedVars[flag.name] ?? flag.default) === 'true'}
                    onChange={(checked) => setEditedVars({ ...editedVars, [flag.name]: String(checked) })}
                  />
                </div>
              ))}
            </div>
          ) : (
            /* Categorized variable list */
            categories.map((cat) => (
              <div key={cat} style={{ background: 'var(--color-solar-card)', border: '1px solid var(--color-solar-border)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                <h4 style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--color-solar-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                  {cat}
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  {currentVars.filter((v) => v.category === cat).map(renderVarRow)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Sticky apply bar */}
      {changedCount > 0 && (
        <div style={{ position: 'sticky', bottom: '1rem', background: 'var(--color-solar-surface)', border: '1px solid var(--color-solar-border)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: 'var(--shadow-modal)' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--color-solar-text-secondary)' }}>
            {changedCount} parameter(s) modified
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button variant="ghost" size="sm" onClick={() => setEditedVars({})}>
              <RotateCcw size={12} /> Discard
            </Button>
            <Button variant="primary" size="sm" onClick={() => setShowConfirm(true)}>
              <Save size={14} /> Apply All Changes
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={showConfirm}
        onCancel={() => setShowConfirm(false)}
        onConfirm={() => {
          setShowConfirm(false);
          setEditedVars({});
          toast.success('Configuration applied', `${changedCount} parameter(s) updated.`);
        }}
        title="Apply Configuration Changes"
        description={`Apply ${changedCount} parameter change(s)? Services may need to be restarted for changes to take effect.`}
        confirmLabel="Apply"
      />
    </div>
  );
}
