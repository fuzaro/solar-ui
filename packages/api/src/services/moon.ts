import type { ApiClientOptions } from '../client';
import { apiRequest } from '../client';
import type { Memory, AuditRecord, HealthResponse, PaginatedResponse, MemoryScope, MemoryType } from '../types';

export function createMoonClient(opts: ApiClientOptions) {
  const req = <T>(method: string, path: string, body?: unknown, query?: Record<string, string | number | boolean | undefined>) =>
    apiRequest<T>(opts, method, path, body, query);

  return {
    health: () => req<HealthResponse>('GET', '/health'),

    memories: {
      list: (params?: { scope?: MemoryScope; type?: MemoryType; tenant_id?: string; page?: number; page_size?: number }) =>
        req<PaginatedResponse<Memory>>('GET', '/v1/memories', undefined, params as Record<string, string | number | boolean | undefined>),
      get: (memoryId: string) => req<Memory>('GET', `/v1/memories/${memoryId}`),
      create: (data: Partial<Memory>) => req<Memory>('POST', '/v1/memories', data),
      update: (memoryId: string, data: Partial<Memory>) => req<Memory>('PATCH', `/v1/memories/${memoryId}`, data),
      delete: (memoryId: string) => req<void>('DELETE', `/v1/memories/${memoryId}`),
      search: (query: string, params?: { scope?: MemoryScope; limit?: number }) =>
        req<Memory[]>('POST', '/v1/memories/search', { query, ...params }),
    },

    audit: {
      list: (params?: { task_id?: string; tenant_id?: string; page?: number; page_size?: number }) =>
        req<PaginatedResponse<AuditRecord>>('GET', '/v1/audit', undefined, params as Record<string, string | number | boolean | undefined>),
      get: (recordId: string) => req<AuditRecord>('GET', `/v1/audit/${recordId}`),
      verify: (recordId: string) => req<{ valid: boolean; chain_intact: boolean }>('GET', `/v1/audit/${recordId}/verify`),
    },

    sessions: {
      list: (params?: { tenant_id?: string; page?: number }) =>
        req<PaginatedResponse<Record<string, unknown>>>('GET', '/v1/sessions', undefined, params as Record<string, string | number | boolean | undefined>),
    },

    steps: {
      list: (taskId: string) =>
        req<Record<string, unknown>[]>('GET', `/v1/tasks/${taskId}/steps`),
    },

    logs: {
      list: (params?: { task_id?: string; level?: string; page?: number; page_size?: number }) =>
        req<PaginatedResponse<Record<string, unknown>>>('GET', '/v1/logs', undefined, params as Record<string, string | number | boolean | undefined>),
    },
  };
}

export type MoonClient = ReturnType<typeof createMoonClient>;
