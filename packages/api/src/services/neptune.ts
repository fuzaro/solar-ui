import type { ApiClientOptions } from '../client';
import { apiRequest } from '../client';
import type { Provider, CreateProviderRequest, Model, ModelQuality, HealthResponse, PaginatedResponse } from '../types';

export function createNeptuneClient(opts: ApiClientOptions) {
  const req = <T>(method: string, path: string, body?: unknown, query?: Record<string, string | number | boolean | undefined>) =>
    apiRequest<T>(opts, method, path, body, query);

  return {
    // CR21 — Neptune serve health em /v1/health, não root (inconsistência
    // interna R3; Mars/Moon/Saturn servem em /health). Quando R3
    // padronizar (CR23 aberto), voltar para '/health'.
    health: () => req<HealthResponse>('GET', '/v1/health'),

    providers: {
      list: () => req<Provider[]>('GET', '/v1/providers'),
      get: (providerId: string) => req<Provider>('GET', `/v1/providers/${providerId}`),
      create: (data: CreateProviderRequest) => req<Provider>('POST', '/v1/providers', data),
      delete: (providerId: string) => req<void>('DELETE', `/v1/providers/${providerId}`),
      sync: (providerId: string) => req<void>('POST', `/v1/providers/${providerId}/sync`),
    },

    models: {
      list: (params?: { provider_id?: string; tier?: string; status?: string }) =>
        req<PaginatedResponse<Model>>('GET', '/v1/models', undefined, params as Record<string, string | number | boolean | undefined>),
      get: (modelId: string) => req<Model>('GET', `/v1/models/${modelId}`),
      register: (data: Partial<Model>) => req<Model>('POST', '/v1/models', data),
      updatePriority: (modelId: string, priority: number) =>
        req<Model>('PATCH', `/v1/models/${modelId}`, { priority }),
      getQuality: (modelId: string) => req<ModelQuality>('GET', `/v1/models/${modelId}/quality`),
      listQuality: () => req<ModelQuality[]>('GET', '/v1/models/quality'),
    },

    inference: {
      complete: (data: { model_id?: string; messages: unknown[]; stream?: boolean }) =>
        req<Record<string, unknown>>('POST', '/v1/inference/complete', data),
    },
  };
}

export type NeptuneClient = ReturnType<typeof createNeptuneClient>;
