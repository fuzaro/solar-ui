import { createSolarClients } from '@solar/api';

export const solar = createSolarClients({
  venus:   import.meta.env.PUBLIC_VENUS_URL   ?? 'http://localhost:8000',
  neptune: import.meta.env.PUBLIC_NEPTUNE_URL ?? 'http://localhost:8001',
  mars:    import.meta.env.PUBLIC_MARS_URL    ?? 'http://localhost:8002',
  moon:    import.meta.env.PUBLIC_MOON_URL    ?? 'http://localhost:8003',
  saturn:  import.meta.env.PUBLIC_SATURN_URL  ?? 'http://localhost:8006',
  sun:     import.meta.env.PUBLIC_SUN_URL     ?? 'http://localhost:8007',
  pluto:   import.meta.env.PUBLIC_PLUTO_URL   ?? 'http://localhost:8008',
  themis:  import.meta.env.PUBLIC_THEMIS_URL  ?? 'http://localhost:8009',
  getToken: () => localStorage.getItem('solar_token'),
});
