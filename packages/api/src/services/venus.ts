import type { ApiClientOptions } from '../client';
import { apiRequest } from '../client';
import type { Task, TaskSubmitRequest, HealthResponse, PaginatedResponse, TaskStatus } from '../types';

export interface VenusClientOptions extends ApiClientOptions {}

export function createVenusClient(opts: VenusClientOptions) {
  const req = <T>(method: string, path: string, body?: unknown, query?: Record<string, string | number | boolean | undefined>) =>
    apiRequest<T>(opts, method, path, body, query);

  return {
    health: () => req<HealthResponse>('GET', '/health'),

    tasks: {
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
