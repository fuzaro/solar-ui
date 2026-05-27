import type { ApiClientOptions } from '../client';
import { apiRequest } from '../client';
import type { HealthResponse, PaginatedResponse } from '../types';

export function createMarsClient(opts: ApiClientOptions) {
  const req = <T>(method: string, path: string, body?: unknown, query?: Record<string, string | number | boolean | undefined>) =>
    apiRequest<T>(opts, method, path, body, query);

  return {
    health: () => req<HealthResponse>('GET', '/health'),

    executions: {
      list: (params?: { task_id?: string; status?: string; tenant_id?: string; page?: number; page_size?: number }) =>
        req<PaginatedResponse<Record<string, unknown>>>('GET', '/v1/executions', undefined, params as Record<string, string | number | boolean | undefined>),
      get: (execId: string) =>
        req<Record<string, unknown>>('GET', `/v1/executions/${execId}`),
      cancel: (execId: string) =>
        req<void>('POST', `/v1/executions/${execId}/cancel`),
      logs: (execId: string, params?: { lines?: number; follow?: boolean }) =>
        req<{ lines: string[] }>('GET', `/v1/executions/${execId}/logs`, undefined, params as Record<string, string | number | boolean | undefined>),
    },

    // budget.* endpoints removidos em v0.1.2 (CR20 + CR25) — R5 inventou
    // semantic per-tenant; Mars publica budget per-exec_id em
    // /v1/budget/{exec_id} (routes.py:483) e Saturn não expõe budget_ledger
    // via REST. Reintroduzir quando ADR R3 especificar endpoint REST de
    // ledger (CR20 aberto).

    containers: {
      list: (params?: { status?: string; page?: number }) =>
        req<PaginatedResponse<Record<string, unknown>>>('GET', '/v1/containers', undefined, params as Record<string, string | number | boolean | undefined>),
      get: (containerId: string) =>
        req<Record<string, unknown>>('GET', `/v1/containers/${containerId}`),
    },
  };
}

export type MarsClient = ReturnType<typeof createMarsClient>;
