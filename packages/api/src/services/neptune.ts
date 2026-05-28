import type { ApiClientOptions } from '../client';
import { apiRequest } from '../client';
import type { Provider, CreateProviderRequest, Model, ModelQuality, HealthResponse, PaginatedResponse } from '../types';

// CR29 — Neptune Provider response usa name/url/created_at; type R5
// espera display_name/base_url/registered_at + model_count. Adapter
// preenche os defaults sensatos. Mesmo pattern de moon.audit (CR26)
// e sun.skills (CR28). Quando Neptune spec alinhar nomes (ADR R3),
// remover fallbacks — type Provider não muda.
const adaptProvider = (p: Record<string, unknown>): Provider => ({
  provider_id:   String(p.provider_id ?? ''),
  display_name:  String(p.display_name ?? p.name ?? ''),
  type:          p.type as Provider['type'],
  base_url:      String(p.base_url ?? p.url ?? ''),
  status:        p.status as Provider['status'],
  model_count:   (p.model_count as number) ?? 0,
  auth_type:     p.auth_type as Provider['auth_type'],
  registered_at: String(p.registered_at ?? p.created_at ?? ''),
});

export function createNeptuneClient(opts: ApiClientOptions) {
  const req = <T>(method: string, path: string, body?: unknown, query?: Record<string, string | number | boolean | undefined>) =>
    apiRequest<T>(opts, method, path, body, query);

  return {
    // CR21 — Neptune serve health em /v1/health, não root (inconsistência
    // interna R3; Mars/Moon/Saturn servem em /health). Quando R3
    // padronizar (CR23 aberto), voltar para '/health'.
    health: () => req<HealthResponse>('GET', '/v1/health'),

    providers: {
      list: async (): Promise<Provider[]> => {
        const raw = await req<Record<string, unknown>[]>('GET', '/v1/providers');
        return raw.map(adaptProvider);
      },
      get: async (providerId: string): Promise<Provider> =>
        adaptProvider(await req<Record<string, unknown>>('GET', `/v1/providers/${providerId}`)),
      create: (data: CreateProviderRequest) => req<Provider>('POST', '/v1/providers', data),
      delete: (providerId: string) => req<void>('DELETE', `/v1/providers/${providerId}`),
      // sync removido em v0.1.6 (CR29) — Neptune não publica
      // /v1/providers/{id}/sync (R5 inventou). Neptune publica /health
      // e /discover; reintroduzir como discover/health se houver demanda.
    },

    models: {
      list: (params?: { provider_id?: string; tier?: string; status?: string }) =>
        req<PaginatedResponse<Model>>('GET', '/v1/models', undefined, params as Record<string, string | number | boolean | undefined>),
      get: (modelId: string) => req<Model>('GET', `/v1/models/${modelId}`),
      register: (data: Partial<Model>) => req<Model>('POST', '/v1/models', data),
      updatePriority: (modelId: string, priority: number) =>
        req<Model>('PATCH', `/v1/models/${modelId}`, { priority }),
      getQuality: (modelId: string) => req<ModelQuality>('GET', `/v1/models/${modelId}/quality`),
      // listQuality removido em v0.1.6 (CR30) — R5 inventou GET
      // /v1/models/quality (list). Neptune publica /v1/models/{id}/quality
      // por ID. Lazy-load por ID seria N+1; design correto é Neptune
      // publicar list endpoint (CR35 aberto para R3).
    },

    inference: {
      complete: (data: { model_id?: string; messages: unknown[]; stream?: boolean }) =>
        req<Record<string, unknown>>('POST', '/v1/inference/complete', data),
    },
  };
}

export type NeptuneClient = ReturnType<typeof createNeptuneClient>;
