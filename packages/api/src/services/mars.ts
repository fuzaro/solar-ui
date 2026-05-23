import type { ApiClientOptions } from '../client';
import { apiRequest } from '../client';
import type { BudgetLedgerEntry, HealthResponse, PaginatedResponse } from '../types';

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

    budget: {
      get: (tenantId: string) =>
        req<{ balance: number; spent: number; limit: number }>('GET', `/v1/budget/${tenantId}`),
      ledger: (tenantId: string, params?: { page?: number; page_size?: number }) =>
        req<PaginatedResponse<BudgetLedgerEntry>>('GET', `/v1/budget/${tenantId}/ledger`, undefined, params as Record<string, string | number | boolean | undefined>),
      grant: (tenantId: string, data: { amount: number; description?: string }) =>
        req<BudgetLedgerEntry>('POST', `/v1/budget/${tenantId}/grant`, data),
      reset: (tenantId: string) =>
        req<void>('POST', `/v1/budget/${tenantId}/reset`),
    },

    containers: {
      list: (params?: { status?: string; page?: number }) =>
        req<PaginatedResponse<Record<string, unknown>>>('GET', '/v1/containers', undefined, params as Record<string, string | number | boolean | undefined>),
      get: (containerId: string) =>
        req<Record<string, unknown>>('GET', `/v1/containers/${containerId}`),
    },
  };
}

export type MarsClient = ReturnType<typeof createMarsClient>;
