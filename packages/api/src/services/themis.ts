import type { ApiClientOptions } from '../client';
import { apiRequest } from '../client';
import type { HealthResponse } from '../types';

// CR31 (v0.1.6) — R5 inventou uma API Themis que não corresponde à
// real. Themis publica (poc/themis/app/routes/*.py): recognition,
// hyde, audit, reputation, verdicts, aura/envelope, aura/finalize,
// recommend/task, health, methodologies/criteria. Dos 9 endpoints
// que R5 esperava, só `criteria.list` (GET /v1/criteria) existe.
// Removidos: shadow.{recommend,list}, aura.{evaluate,get},
// divergence.{analyze,list}, criteria.evaluate (todos inventados).
// Reformulação da API canônica de Themis (alinhada com 4R-methodology)
// é decisão arquitetural R3-side — CR34 aberto. Aqui só descartamos.
export function createThemisClient(opts: ApiClientOptions) {
  const req = <T>(method: string, path: string, body?: unknown, query?: Record<string, string | number | boolean | undefined>) =>
    apiRequest<T>(opts, method, path, body, query);

  return {
    health: () => req<HealthResponse>('GET', '/health'),

    criteria: {
      list: () => req<Record<string, unknown>[]>('GET', '/v1/criteria'),
    },
  };
}

export type ThemisClient = ReturnType<typeof createThemisClient>;
