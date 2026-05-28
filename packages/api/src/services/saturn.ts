import type { ApiClientOptions } from '../client';
import { apiRequest } from '../client';
import type {
  AuthValidateResponse,
  EnvelopeOverride,
  FgaBackfillResponse,
  HealthResponse,
  ReconcileOrphanRequest,
  ReconcileOrphanResponse,
  SkillGrantResponse,
} from '../types';

export function createSaturnClient(opts: ApiClientOptions) {
  const req = <T>(method: string, path: string, body?: unknown, query?: Record<string, string | number | boolean | undefined>) =>
    apiRequest<T>(opts, method, path, body, query);

  return {
    health: () => req<HealthResponse>('GET', '/health'),

    auth: {
      validate: (token: string) =>
        req<AuthValidateResponse>('POST', '/v1/auth/validate', { token }),
    },

    // executions removido em v0.1.3 (CR2) — Saturn não publica
    // /v1/executions; Mars publica (filtros task_id/status/tenant_id/
    // page/page_size é superset). Usar solar.mars.executions.list.

    // audit removido em v0.1.3 (CR3) — era código morto (zero callers).
    // Emit real via Moon /v1/audit/records (per ADR-008); list via
    // solar.moon.audit.list (corrigido em v0.1.2 F8 + v0.1.3 F13).

    admin: {
      // getConfig/setConfig removidos em v0.1.3 (CR5) — R5 inventou
      // (Saturn não publica /v1/admin/config). R5 usava como "dicionário
      // genérico" workaround para tenant mgmt. Tenant mgmt real aguarda
      // ADR R3 (Saturn admin_routes.py já tem POST /v1/admin/tenants;
      // falta leitura/listagem REST). CR5/CR20 abertos.
      // ParameterEditor (engineering) usa dados hardcoded; não depende.

      // ─── Envelope Override Admin (ADR-010) ─────────────────────────────────────────

      getEnvelopeOverride: (principalId: string) =>
        req<{ ok: boolean; envelope_override: EnvelopeOverride }>('GET', `/v1/admin/principals/${principalId}/envelope`),

      setEnvelopeOverride: (principalId: string, override: EnvelopeOverride) =>
        req<{ ok: boolean; envelope_override: EnvelopeOverride }>('PUT', `/v1/admin/principals/${principalId}/envelope`, override),

      updateEnvelopeKey: (principalId: string, key: string, value: unknown) =>
        req<{ ok: boolean; envelope_override: EnvelopeOverride }>('PUT', `/v1/admin/principals/${principalId}/envelope/${key}`, { value }),

      deleteEnvelopeKey: (principalId: string, key: string) =>
        req<{ ok: boolean; envelope_override: EnvelopeOverride }>('DELETE', `/v1/admin/principals/${principalId}/envelope/${key}`),

      resetEnvelope: (principalId: string) =>
        req<{ ok: boolean; envelope_override: Record<string, never> }>('DELETE', `/v1/admin/principals/${principalId}/envelope`),

      // ─── FGA Skill Admin (ADR-013) ─────────────────────────────────────────────────

      grantSkill: (principalId: string, skillId: string) =>
        req<SkillGrantResponse>('POST', `/v1/admin/principals/${principalId}/skills/${skillId}/grant`),

      revokeSkill: (principalId: string, skillId: string) =>
        req<SkillGrantResponse>('POST', `/v1/admin/principals/${principalId}/skills/${skillId}/revoke`),

      backfillFgaGrants: () =>
        req<FgaBackfillResponse>('POST', '/v1/admin/fga/backfill-grants'),

      // ─── Billing Admin (ADR-008) ───────────────────────────────────────────────────

      reconcileOrphan: (data: ReconcileOrphanRequest) =>
        req<ReconcileOrphanResponse>('POST', '/v1/admin/billing/reconcile-orphan', data),
    },
  };
}

export type SaturnClient = ReturnType<typeof createSaturnClient>;
