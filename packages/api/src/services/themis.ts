import type { ApiClientOptions } from '../client';
import { apiRequest } from '../client';
import type { ShadowRecommendation, AuraEnvelope, HealthResponse } from '../types';

export function createThemisClient(opts: ApiClientOptions) {
  const req = <T>(method: string, path: string, body?: unknown, query?: Record<string, string | number | boolean | undefined>) =>
    apiRequest<T>(opts, method, path, body, query);

  return {
    health: () => req<HealthResponse>('GET', '/health'),

    shadow: {
      recommend: (data: { task_id: string; prompt: string; skills: string[] }) =>
        req<ShadowRecommendation>('POST', '/v1/shadow/recommend', data),

      list: (params?: { page?: number; page_size?: number }) =>
        req<ShadowRecommendation[]>('GET', '/v1/shadow/recommendations', undefined, params as Record<string, string | number | boolean | undefined>),
    },

    aura: {
      evaluate: (data: { exec_id: string; output: Record<string, unknown> }) =>
        req<AuraEnvelope>('POST', '/v1/aura/evaluate', data),

      get: (execId: string) =>
        req<AuraEnvelope>('GET', `/v1/aura/${execId}`),
    },

    divergence: {
      analyze: (data: { task_id: string }) =>
        req<{ divergent: boolean; detail: string }>('POST', '/v1/divergence/analyze', data),

      list: (params?: { page?: number }) =>
        req<Record<string, unknown>[]>('GET', '/v1/divergence', undefined, params as Record<string, string | number | boolean | undefined>),
    },

    criteria: {
      list: () => req<Record<string, unknown>[]>('GET', '/v1/criteria'),
      evaluate: (data: { criterion_id: string; input: Record<string, unknown> }) =>
        req<{ result: string; confidence: number }>('POST', '/v1/criteria/evaluate', data),
    },
  };
}

export type ThemisClient = ReturnType<typeof createThemisClient>;
