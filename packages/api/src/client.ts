import type { ApiError } from './types';

export interface ApiClientOptions {
  baseUrl: string;
  getToken?: () => string | null;
  onError?: (error: ApiError) => void;
}

export class SolarApiError extends Error {
  constructor(public readonly error: ApiError) {
    super(error.message);
    this.name = 'SolarApiError';
  }
}

export async function apiRequest<T>(
  opts: ApiClientOptions,
  method: string,
  path: string,
  body?: unknown,
  query?: Record<string, string | number | boolean | undefined>
): Promise<T> {
  const url = new URL(path, opts.baseUrl);
  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined) url.searchParams.set(k, String(v));
    });
  }
  const token = opts.getToken?.();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(url.toString(), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    let error: ApiError;
    try {
      const json = await response.json();
      error = { status: response.status, code: json.code || 'UNKNOWN', message: json.detail || json.message || response.statusText, detail: json };
    } catch {
      error = { status: response.status, code: 'UNKNOWN', message: response.statusText };
    }
    opts.onError?.(error);
    throw new SolarApiError(error);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
