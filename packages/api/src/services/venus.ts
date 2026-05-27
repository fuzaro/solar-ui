import type { ApiClientOptions } from '../client';
import { apiRequest, SolarApiError } from '../client';
import type { CaixaPayload, Task, TaskSubmitRequest, HealthResponse, PaginatedResponse, TaskStatus } from '../types';

export interface VenusClientOptions extends ApiClientOptions {}

export function createVenusClient(opts: VenusClientOptions) {
  const req = <T>(method: string, path: string, body?: unknown, query?: Record<string, string | number | boolean | undefined>) =>
    apiRequest<T>(opts, method, path, body, query);

  return {
    // CR21 — Venus serve health em /v1/health, não root (inconsistência
    // interna R3; Mars/Moon/Saturn servem em /health). Quando R3
    // padronizar (CR23 aberto), voltar para '/health'.
    health: () => req<HealthResponse>('GET', '/v1/health'),

    tasks: {
      /**
       * Submit a task.
       *
       * May throw `SolarApiError` with `error.status === 402` when the
       * Balance Gate (G2) rejects the request.  In that case the
       * `error.detail` field contains a {@link CaixaPayload} body with
       * balance info and an optional recharge URL.
       */
      submit: (data: TaskSubmitRequest) =>
        req<Task>('POST', '/v1/tasks', data),

      list: (params?: {
        status?: TaskStatus;
        tenant_id?: string;
        page?: number;
        page_size?: number;
        sort?: string;
      }) => req<PaginatedResponse<Task>>('GET', '/v1/tasks', undefined, params as Record<string, string | number | boolean | undefined>),

      get: (taskId: string) =>
        req<Task>('GET', `/v1/tasks/${taskId}`),

      cancel: (taskId: string) =>
        req<Task>('POST', `/v1/tasks/${taskId}/cancel`),

      poll: (taskId: string) =>
        req<Task>('GET', `/v1/tasks/${taskId}/poll`),
    },
  };
}

export type VenusClient = ReturnType<typeof createVenusClient>;

/**
 * Type-guard: returns the {@link CaixaPayload} when a `SolarApiError`
 * originated from Balance Gate (HTTP 402), or `null` otherwise.
 */
export function parseCaixaPayload(err: unknown): CaixaPayload | null {
  if (err instanceof SolarApiError && err.error.status === 402) {
    return (err.error.detail ?? null) as CaixaPayload | null;
  }
  return null;
}
