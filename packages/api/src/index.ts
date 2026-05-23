export * from './types';
export * from './client';

import { createVenusClient } from './services/venus';
import { createSaturnClient } from './services/saturn';
import { createNeptuneClient } from './services/neptune';
import { createSunClient } from './services/sun';
import { createMoonClient } from './services/moon';
import { createPlutoClient } from './services/pluto';
import { createThemisClient } from './services/themis';
import { createMarsClient } from './services/mars';

export { createVenusClient, createSaturnClient, createNeptuneClient, createSunClient, createMoonClient, createPlutoClient, createThemisClient, createMarsClient };

// ─── Convenience factory ─────────────────────────────────────

export interface SolarConfig {
  /** Venus API Gateway — http://localhost:8000 */
  venus: string;
  /** Neptune Inference Gateway — http://localhost:8001 */
  neptune: string;
  /** Mars Execution Engine — http://localhost:8002 */
  mars: string;
  /** Moon Memory & Audit — http://localhost:8003 */
  moon: string;
  /** Saturn Identity & Billing — http://localhost:8006 */
  saturn: string;
  /** Sun Orchestrator — http://localhost:8007 */
  sun: string;
  /** Pluto Security & AuthZ — http://localhost:8008 */
  pluto: string;
  /** Themis Judgment Plane — http://localhost:8009 */
  themis: string;
  /** Token provider — called before each request */
  getToken?: () => string | null;
}

/**
 * Create all Solar Systems API clients in one call.
 *
 * @example
 * const solar = createSolarClients({
 *   venus: import.meta.env.VENUS_URL,
 *   neptune: import.meta.env.NEPTUNE_URL,
 *   mars: import.meta.env.MARS_URL,
 *   moon: import.meta.env.MOON_URL,
 *   saturn: import.meta.env.SATURN_URL,
 *   sun: import.meta.env.SUN_URL,
 *   pluto: import.meta.env.PLUTO_URL,
 *   themis: import.meta.env.THEMIS_URL,
 *   getToken: () => getSession()?.token ?? null,
 * });
 */
export function createSolarClients(config: SolarConfig) {
  const opts = (base: string) => ({
    baseUrl: base,
    getToken: config.getToken,
  });

  return {
    venus:   createVenusClient(opts(config.venus)),
    neptune: createNeptuneClient(opts(config.neptune)),
    mars:    createMarsClient(opts(config.mars)),
    moon:    createMoonClient(opts(config.moon)),
    saturn:  createSaturnClient(opts(config.saturn)),
    sun:     createSunClient(opts(config.sun)),
    pluto:   createPlutoClient(opts(config.pluto)),
    themis:  createThemisClient(opts(config.themis)),
  };
}

export type SolarClients = ReturnType<typeof createSolarClients>;
