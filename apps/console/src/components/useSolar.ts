'use client';

import { useMemo } from 'react';
import { createSolarClients, getSolarConfig, type SolarClients } from '@solar/api';
import { getSession } from '@solar/auth';

let cached: SolarClients | null = null;

export function getSolarClients(): SolarClients {
  if (cached) return cached;
  cached = createSolarClients({
    ...getSolarConfig(),
    getToken: () => getSession()?.token ?? null,
  });
  return cached;
}

export function useSolar(): SolarClients {
  return useMemo(() => getSolarClients(), []);
}
