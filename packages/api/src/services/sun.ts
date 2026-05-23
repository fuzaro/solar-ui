import type { ApiClientOptions } from '../client';
import { apiRequest } from '../client';
import type { Task, Agent, RegisterAgentRequest, Resource, Skill, HealthResponse, PaginatedResponse } from '../types';

export function createSunClient(opts: ApiClientOptions) {
  const req = <T>(method: string, path: string, body?: unknown, query?: Record<string, string | number | boolean | undefined>) =>
    apiRequest<T>(opts, method, path, body, query);

  return {
    health: () => req<HealthResponse>('GET', '/health'),

    tasks: {
      list: (params?: { page?: number; page_size?: number; status?: string }) =>
        req<PaginatedResponse<Task>>('GET', '/v1/tasks', undefined, params as Record<string, string | number | boolean | undefined>),
      get: (taskId: string) => req<Task>('GET', `/v1/tasks/${taskId}`),
    },

    agents: {
      list: (params?: { tier?: string; status?: string; page?: number; page_size?: number }) =>
        req<PaginatedResponse<Agent>>('GET', '/v1/agents', undefined, params as Record<string, string | number | boolean | undefined>),
      get: (agentId: string) => req<Agent>('GET', `/v1/agents/${agentId}`),
      register: (data: RegisterAgentRequest) => req<Agent>('POST', '/v1/agents', data),
      update: (agentId: string, data: Partial<Agent>) => req<Agent>('PATCH', `/v1/agents/${agentId}`, data),
      deprecate: (agentId: string) => req<Agent>('POST', `/v1/agents/${agentId}/deprecate`),
    },

    resources: {
      list: (params?: { tenant_id?: string; type?: string; page?: number }) =>
        req<PaginatedResponse<Resource>>('GET', '/v1/resources', undefined, params as Record<string, string | number | boolean | undefined>),
      get: (resourceId: string) => req<Resource>('GET', `/v1/resources/${resourceId}`),
      register: (data: Partial<Resource>) => req<Resource>('POST', '/v1/resources', data),
      update: (resourceId: string, data: Partial<Resource>) => req<Resource>('PATCH', `/v1/resources/${resourceId}`, data),
      delete: (resourceId: string) => req<void>('DELETE', `/v1/resources/${resourceId}`),
    },

    skills: {
      list: () => req<Skill[]>('GET', '/v1/skills'),
      get: (skillId: string) => req<Skill>('GET', `/v1/skills/${skillId}`),
      register: (data: Partial<Skill>) => req<Skill>('POST', '/v1/skills', data),
    },

    adequation: {
      evaluate: (data: { task_id: string; prompt: string; skills: string[] }) =>
        req<{ agent_id: string; model_id: string; budget: Record<string, unknown> }>('POST', '/v1/adequation/evaluate', data),
    },
  };
}

export type SunClient = ReturnType<typeof createSunClient>;
