import type { ApiClientOptions } from '../client';
import { apiRequest } from '../client';
import type {
  AuthValidateResponse,
  AuditRecord,
  EnvelopeOverride,
  FgaBackfillResponse,
  HealthResponse,
  PaginatedResponse,
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

    executions: {
      list: (params?: { tenant_id?: string; page?: number; page_size?: number }) =>
        req<PaginatedResponse<Record<string, unknown>>>('GET', '/v1/executions', undefined, params as Record<string, string | number | boolean | undefined>),
    },

    audit: {
      emit: (event: { event_type: string; payload: Record<string, unknown> }) =>
        req<AuditRecord>('POST', '/v1/audit', event),

      list: (params?: { tenant_id?: string; page?: number; page_size?: number }) =>
        req<PaginatedResponse<AuditRecord>>('GET', '/v1/audit', undefined, params as Record<string, string | number | boolean | undefined>),
    },

    admin: {
      getConfig: () =>
        req<Record<string, unknown>>('GET', '/v1/admin/config'),

      setConfig: (config: Record<string, unknown>) =>
        req<void>('PUT', '/v1/admin/config', config),

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
