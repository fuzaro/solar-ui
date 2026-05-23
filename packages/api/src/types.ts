// ─── Enums ──────────────────────────────────────────────────

export type PlanetId = 'sun'|'moon'|'mercury'|'venus'|'mars'|'saturn'|'neptune'|'pluto'|'themis';
export type AuraBand = 'green'|'yellow'|'orange'|'red'|'violet'|'dim';
export type ServiceStatus = 'healthy'|'degraded'|'unreachable'|'maintenance';
export type ModuleState = 'enabled'|'disabled'|'degraded'|'maintenance';
export type AgentTier = 'nano'|'standard'|'advanced'|'specialized'|'ops_only';
export type TrustTier = 'unverified'|'standard'|'trusted'|'system';
export type AgentStatus = 'active'|'canary'|'deprecated'|'retired';
export type ModelTier = 'nano'|'standard'|'advanced'|'specialized';
export type ProviderType = 'ollama'|'openai_compatible';
export type ResourceType = 'database'|'api'|'file_storage'|'cloud_storage'|'integration'|'message_queue'|'model'|'internal_service'|'rag_index'|'mcp_server'|'function';
export type ResourceSensitivity = 'Public'|'Internal'|'Confidential'|'Restricted';
export type PrivilegeMode = 'supervised'|'managed'|'autonomous';
export type SecurityLevel = 'Public'|'Internal'|'Confidential'|'Restricted';
export type LifecycleType = 'run_once'|'batch'|'scheduled'|'long_running'|'reactive';
export type QuotaMode = 'hard'|'soft'|'disabled';
export type PrincipalRole = 'admin'|'member'|'readonly';
export type ApiScope = 'submit'|'read'|'admin';
export type TaskStatus = 'pending'|'running'|'success'|'failed'|'timeout'|'cancelled';
export type ExecutionStep = 'INTAKE'|'ADEQUATION'|'PREPARATION'|'EXECUTION'|'EVALUATION'|'DELIVERY'|'AUDIT';
export type CompletionPolicy = 'all_must_succeed'|'first_result_wins'|`partial_success_threshold:${number}`;
export type TaskMode = 'sync'|'async_poll'|'async_webhook';
export type MemoryScope = 'platform'|'tenant'|'user';
export type MemoryType = 'episodic'|'semantic'|'procedural'|'working';
export type TenantType = 'individual'|'enterprise'|'community'|'internal';

// ─── Core Entities ──────────────────────────────────────────

export interface HealthResponse {
  status: ServiceStatus;
  version: string;
  uptime_s: number;
  dependencies?: Record<string, ServiceStatus>;
  timestamp: string;
}

export interface Task {
  task_id: string;
  tenant_id: string;
  principal_id: string;
  status: TaskStatus;
  current_step: number;
  prompt: string;
  skills: SkillRef[];
  resources: ResourceRef[];
  mode: TaskMode;
  depth: number;
  parent_task_id: string | null;
  result: TaskResult | null;
  quality_metadata: QualityMetadata | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  tags: Record<string, string>;
}

export interface TaskResult {
  output: Record<string, unknown>;
  truncated: boolean;
  tool_calls: ToolCall[];
  agent_notes: string;
}

export interface QualityMetadata {
  confidence: number;
  flags: 'clean'|'pii_redacted'|'schema_corrected'|'completion_retried'|'low_confidence';
  gates: QualityGateResult[];
  aura?: AuraEnvelope;
}

export interface QualityGateResult {
  gate: 'safety'|'pii'|'schema'|'completion'|'confidence'|'regression';
  result: 'pass'|'warn'|'fail';
  detail?: string;
}

export interface AuraEnvelope {
  version: string;
  overall_band: AuraBand;
  axes: Record<string, { band: AuraBand; value: number; lower: number; upper: number }>;
}

export interface TaskSubmitRequest {
  idempotency_key: string;
  prompt: string;
  skills: SkillRef[];
  resources?: ResourceRef[];
  mode?: TaskMode;
  callback_url?: string;
  sla?: { max_latency_ms?: number; priority?: 'low'|'normal'|'high'; deadline?: string };
  quota_overrides?: Partial<QuotaConfig>;
  tags?: Record<string, string>;
  context_ref?: string;
  parent_task_id?: string;
  completion_policy?: CompletionPolicy;
}

export interface SkillRef { skill_id: string; version?: string; parameters?: Record<string, unknown> }
export interface ResourceRef { resource_id: string; type: string; access: 'read'|'write'|'read_write' }
export interface ToolCall { tool: string; status: 'ok'|'error'; error?: string; duration_ms?: number }

export interface QuotaConfig {
  tokens: QuotaDimension;
  time_ms: QuotaDimension;
  cost_usd: QuotaDimension;
  tool_calls: QuotaDimension;
  memory_calls: QuotaDimension;
  kb_calls: QuotaDimension;
  agent_calls: QuotaDimension;
  retries: QuotaDimension;
}
export interface QuotaDimension { mode: QuotaMode; limit: number; ceiling?: number }

export interface Agent {
  agent_id: string;
  display_name: string;
  tier: AgentTier;
  trust_tier: TrustTier;
  status: AgentStatus;
  version: string;
  image_ref: string;
  skills: string[];
  privilege_mode: PrivilegeMode;
  lifecycle_types: LifecycleType[];
  default_budget: Partial<QuotaConfig>;
  quality_score: number;
  side_effects: string[];
  registered_at: string;
  description?: string;
}

export interface RegisterAgentRequest {
  agent_id: string;
  display_name: string;
  tier: AgentTier;
  version: string;
  image_ref: string;
  skills: string[];
  privilege_mode: PrivilegeMode;
  lifecycle_types: LifecycleType[];
  default_budget?: Partial<QuotaConfig>;
  side_effects?: string[];
  description?: string;
}

export interface Provider {
  provider_id: string;
  display_name: string;
  type: ProviderType;
  base_url: string;
  status: ServiceStatus;
  model_count: number;
  auth_type: 'none'|'bearer'|'api_key';
  registered_at: string;
}

export interface CreateProviderRequest {
  display_name: string;
  type: ProviderType;
  base_url: string;
  auth_type?: 'none'|'bearer'|'api_key';
  auth_token?: string;
}

export interface Model {
  model_id: string;
  display_name: string;
  provider_id: string;
  tier: ModelTier;
  context_window: number;
  capabilities: string[];
  priority: number;
  quality_score: number;
  status: 'available'|'unavailable'|'deprecated';
  registered_at: string;
}

export interface ModelQuality {
  model_id: string;
  tool_success_rate: number;
  non_hallucination: number;
  quality_score: number;
  sample_count: number;
  last_updated: string;
}

export interface Resource {
  resource_id: string;
  display_name: string;
  tenant_id: string;
  type: ResourceType;
  endpoint: string;
  sensitivity: ResourceSensitivity;
  allowed_actions: string[];
  allowed_teams: string[];
  health: ServiceStatus;
  registered_at: string;
  description?: string;
}

export interface Skill {
  skill_id: string;
  display_name: string;
  version: string;
  description: string;
  tool_groups: string[];
  compatible_tiers: AgentTier[];
  parameters_schema?: Record<string, unknown>;
}

export interface Tenant {
  tenant_id: string;
  display_name: string;
  type: TenantType;
  status: 'active'|'suspended'|'deleted';
  plan: TenantPlan;
  created_at: string;
}

export interface TenantPlan {
  tiers_allowed: AgentTier[];
  max_concurrent: number;
  models_allowed: string[];
  max_exec_duration_s: number;
  rag_enabled: boolean;
  memory_quota_mb: number;
}

export interface Principal {
  principal_id: string;
  tenant_id: string;
  display_name: string;
  email: string;
  role: PrincipalRole;
  type: 'human'|'service_account'|'api_client';
  status: 'active'|'suspended';
  created_at: string;
}

export interface ApiKey {
  key_id: string;
  principal_id: string;
  tenant_id: string;
  label: string;
  scopes: ApiScope[];
  expires_at: string | null;
  status: 'active'|'revoked';
  created_at: string;
  last_used_at: string | null;
}

export interface BudgetLedgerEntry {
  entry_id: string;
  tenant_id: string;
  principal_id: string;
  exec_id: string | null;
  operation: 'credit'|'debit'|'reset'|'grant';
  amount: number;
  balance_after: number;
  created_at: string;
  description?: string;
}

export interface AuditRecord {
  record_id: string;
  task_id: string | null;
  principal_id: string;
  tenant_id: string;
  event_type: string;
  planet_source: PlanetId;
  payload: Record<string, unknown>;
  hash: string;
  prev_hash: string;
  created_at: string;
}

export interface Memory {
  memory_id: string;
  tenant_id: string;
  scope: MemoryScope;
  type: MemoryType;
  content: string;
  embedding?: number[];
  source_exec_id?: string;
  tags: string[];
  pinned: boolean;
  access_count: number;
  expires_at: string | null;
  created_at: string;
}

export interface Token {
  token_id: string;
  principal_id: string;
  task_id: string;
  scopes: string[];
  expires_at: string;
  status: 'active'|'revoked';
  issued_at: string;
}

export interface ShadowRecommendation {
  request_id: string;
  recommended_model_id: string;
  recommended_agent_id: string;
  confidence: number;
  aura: AuraEnvelope;
  status: 'shadow';
  evaluated_at: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface ApiError {
  status: number;
  code: string;
  message: string;
  detail?: unknown;
}

export interface AuthValidateResponse {
  principal_id: string;
  tenant_id: string;
  scopes: ApiScope[];
  role: PrincipalRole;
  plan: string;
  expires_at: string;
}
