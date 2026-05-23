'use client';

import { useMemo } from 'react';
import { createSolarClients, type SolarClients } from '@solar/api';
import { getSession } from '@solar/auth';

let cached: SolarClients | null = null;

export function getSolarClients(): SolarClients {
  if (cached) return cached;
  cached = createSolarClients({
    venus:   import.meta.env.PUBLIC_VENUS_URL   ?? 'http://localhost:8000',
    neptune: import.meta.env.PUBLIC_NEPTUNE_URL ?? 'http://localhost:8001',
    mars:    import.meta.env.PUBLIC_MARS_URL    ?? 'http://localhost:8002',
    moon:    import.meta.env.PUBLIC_MOON_URL    ?? 'http://localhost:8003',
    saturn:  import.meta.env.PUBLIC_SATURN_URL  ?? 'http://localhost:8006',
    sun:     import.meta.env.PUBLIC_SUN_URL     ?? 'http://localhost:8007',
    pluto:   import.meta.env.PUBLIC_PLUTO_URL   ?? 'http://localhost:8008',
    themis:  import.meta.env.PUBLIC_THEMIS_URL  ?? 'http://localhost:8009',
    getToken: () => getSession()?.token ?? null,
  });
  return cached;
}

export function useSolar(): SolarClients {
  return useMemo(() => getSolarClients(), []);
}
