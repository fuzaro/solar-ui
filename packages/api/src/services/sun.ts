import type { ApiClientOptions } from '../client';
import { apiRequest } from '../client';
import type { Task, Agent, RegisterAgentRequest, Resource, Skill, HealthResponse, PaginatedResponse } from '../types';

// CR28 — Sun /v1/skills response não inclui `version` nem
// `compatible_tiers` (ambos required no type Skill R5). Adapter
// preenche defaults sensatos para satisfazer type + UI (SkillCatalog
// fazia compatible_tiers.map → TypeError). Quando Sun spec adicionar
// esses campos (ADR R3 futuro), basta remover os defaults — Skill
// type não muda. Mesmo pattern de moon.audit.list (CR26, Bundle 4 F13).
const adaptSkill = (s: Record<string, unknown>): Skill => ({
  skill_id:          String(s.skill_id ?? ''),
  display_name:      String(s.display_name ?? ''),
  version:           (s.version as string) ?? '1.0',
  description:       String(s.description ?? ''),
  tool_groups:       (s.tool_groups as string[]) ?? [],
  compatible_tiers:  (s.compatible_tiers as Skill['compatible_tiers']) ?? ['standard'],
  parameters_schema: s.parameters_schema as Record<string, unknown> | undefined,
});

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
      // CR36a (v0.1.7): Sun /v1/resources retorna array nu; R5 callers
      // (ResourcesPage, TaskSubmitWizard) esperam PaginatedResponse.
      // Adapter envolve. total = arr.length (Sun não pagina server-side
      // hoje). Mesmo pattern de sun.skills (CR28) e neptune.providers (CR29).
      //
      // CR36b (separado, fora deste bundle): Sun exige tenant_id em UUID
      // válido (não-UUID → 500). Resolução: test-data (operador injeta
      // UUID) + produção via Pluto session-mint (CR1). NÃO derivar uuid5
      // client-side.
      list: async (params?: { tenant_id?: string; type?: string; page?: number; page_size?: number }): Promise<PaginatedResponse<Resource>> => {
        const raw = await req<Resource[]>('GET', '/v1/resources', undefined, params as Record<string, string | number | boolean | undefined>);
        const items = raw ?? [];
        return {
          items,
          total: items.length,
          page: params?.page ?? 1,
          page_size: params?.page_size ?? items.length,
        };
      },
      get: (resourceId: string) => req<Resource>('GET', `/v1/resources/${resourceId}`),
      register: (data: Partial<Resource>) => req<Resource>('POST', '/v1/resources', data),
      update: (resourceId: string, data: Partial<Resource>) => req<Resource>('PATCH', `/v1/resources/${resourceId}`, data),
      delete: (resourceId: string) => req<void>('DELETE', `/v1/resources/${resourceId}`),
    },

    skills: {
      list: async (): Promise<Skill[]> => {
        const raw = await req<Record<string, unknown>[]>('GET', '/v1/skills');
        return raw.map(adaptSkill);
      },
      get: async (skillId: string): Promise<Skill> => {
        const s = await req<Record<string, unknown>>('GET', `/v1/skills/${skillId}`);
        return adaptSkill(s);
      },
      register: (data: Partial<Skill>) => req<Skill>('POST', '/v1/skills', data),
    },

    adequation: {
      evaluate: (data: { task_id: string; prompt: string; skills: string[] }) =>
        req<{ agent_id: string; model_id: string; budget: Record<string, unknown> }>('POST', '/v1/adequation/evaluate', data),
    },
  };
}

export type SunClient = ReturnType<typeof createSunClient>;
