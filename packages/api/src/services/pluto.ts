import type { ApiClientOptions } from '../client';
import { apiRequest } from '../client';
import type { Token, HealthResponse } from '../types';

export function createPlutoClient(opts: ApiClientOptions) {
  const req = <T>(method: string, path: string, body?: unknown, query?: Record<string, string | number | boolean | undefined>) =>
    apiRequest<T>(opts, method, path, body, query);

  return {
    health: () => req<HealthResponse>('GET', '/health'),

    tokens: {
      // list: REMOVIDO em v0.1.2 (CR22) — R5 inventou; fora da spec
      //   Pluto §7.1. Não reintroduzir até R3 adicionar à spec.
      // get: na spec Pluto §7.1 mas SEM código em routes_tokens.py
      //   (CR24 aberto para implementação R3). Reintroduzir como
      //   req<Token>('GET', `/v1/tokens/${tokenId}`) quando R3 land.
      revoke: (tokenId: string) => req<void>('POST', `/v1/tokens/${tokenId}/revoke`),
    },

    access: {
      check: (data: { principal_id: string; resource_id: string; action: string }) =>
        req<{ allowed: boolean; reason?: string }>('POST', '/v1/access/check', data),
      bulkCheck: (checks: { principal_id: string; resource_id: string; action: string }[]) =>
        req<{ results: Array<{ allowed: boolean; reason?: string }> }>('POST', '/v1/access/bulk-check', { checks }),
    },

    classify: {
      data: (data: { content: string; context?: string }) =>
        req<{ sensitivity: string; labels: string[]; confidence: number }>('POST', '/v1/classify/data', data),
    },

    policy: {
      list: () => req<Record<string, unknown>[]>('GET', '/v1/policies'),
      evaluate: (data: { principal_id: string; policy_id: string; context: Record<string, unknown> }) =>
        req<{ result: boolean; effects: string[] }>('POST', '/v1/policies/evaluate', data),
    },
  };
}

export type PlutoClient = ReturnType<typeof createPlutoClient>;
