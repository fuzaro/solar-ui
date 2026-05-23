import type { ApiClientOptions } from '../client';
import { apiRequest } from '../client';
import type { AuthValidateResponse, AuditRecord, HealthResponse, PaginatedResponse } from '../types';

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
    },
  };
}

export type SaturnClient = ReturnType<typeof createSaturnClient>;
