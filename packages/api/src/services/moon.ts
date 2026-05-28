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
      // CR4 (v0.1.2) — Moon publica em /v1/audit/records/search com
      //   {records, total} + limit/offset; adapter de wrapper.
      // CR26 (v0.1.3) — adapter expandido para mapear FIELDS do item
      //   também (não só wrapper). Moon retorna {audit_id, event,
      //   detail, content_hash, occurred_at, ...} mas R5 AuditRecord
      //   espera {record_id, event_type, payload, hash, created_at, ...}.
      //   Mapping abaixo é boundary translation única — AuditRecord
      //   em types.ts permanece como contrato consumer-facing.
      //   Caller console passa task_id; Moon usa exec_id na spec audit
      //   e Moon.task_id é sempre null — mapeamos exec_id→task_id.
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
        const raw = await req<{ records: Record<string, unknown>[]; total: number }>(
          'GET', '/v1/audit/records/search', undefined, moonParams,
        );
        return {
          items: raw.records.map((r): AuditRecord => ({
            record_id:     String(r.audit_id ?? ''),
            task_id:       (r.exec_id as string | null | undefined) ?? null,
            principal_id:  String(r.principal_id ?? ''),
            tenant_id:     String(r.tenant_id ?? ''),
            event_type:    String(r.event ?? ''),
            payload:       (r.detail as Record<string, unknown>) ?? {},
            hash:          String(r.content_hash ?? ''),
            prev_hash:     String(r.prev_hash ?? ''),
            created_at:    String(r.occurred_at ?? ''),
            planet_source: 'moon',
          })),
          total: raw.total,
          page,
          page_size: pageSize,
        };
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
