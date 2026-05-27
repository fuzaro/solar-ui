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
      // CR4 — Moon publica em /v1/audit/records/search (não /v1/audit).
      // Shape e params divergem do PaginatedResponse R5 (Moon retorna
      // {records, total} com limit/offset). Adapter abaixo preserva a
      // interface PaginatedResponse + page/page_size para os callers
      // (PlatformAudit, AuditPage) até R3 padronizar — CR-pending.
      // Nota: caller console passava task_id; Moon usa exec_id na spec
      // audit, então mapeamos task_id → exec_id (semantic alignment).
      list: async (params?: { task_id?: string; tenant_id?: string; page?: number; page_size?: number; event?: string }): Promise<PaginatedResponse<AuditRecord>> => {
        const pageSize = params?.page_size ?? 50;
        const page = params?.page ?? 1;
        const moonParams: Record<string, string | number | boolean | undefined> = {
          limit: pageSize,
          offset: (page - 1) * pageSize,
          tenant_id: params?.tenant_id,
          event: params?.event,
          exec_id: params?.task_id,
        };
        const resp = await req<{ records: AuditRecord[]; total: number }>(
          'GET', '/v1/audit/records/search', undefined, moonParams,
        );
        return { items: resp.records, total: resp.total, page, page_size: pageSize };
      },
      byTask: (taskId: string) =>
        req<AuditRecord[]>('GET', `/v1/audit/records/${taskId}`),
      // get/verify por record_id removidos em v0.1.2 — não localizados em
      // Moon routes.py. Reintroduzir quando R3 publicar paths estáveis.
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
