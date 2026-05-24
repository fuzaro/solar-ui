declare global {
  interface Window {
    __SOLAR_CONFIG?: Record<string, string>;
  }
}

function env(key: string, fallback: string): string {
  if (typeof window !== 'undefined' && window.__SOLAR_CONFIG?.[key]) {
    return window.__SOLAR_CONFIG[key];
  }
  return fallback;
}

export function getSolarConfig() {
  return {
    venus:   env('VENUS_URL', 'http://localhost:8000'),
    neptune: env('NEPTUNE_URL', 'http://localhost:8001'),
    mars:    env('MARS_URL', 'http://localhost:8002'),
    moon:    env('MOON_URL', 'http://localhost:8003'),
    saturn:  env('SATURN_URL', 'http://localhost:8006'),
    sun:     env('SUN_URL', 'http://localhost:8007'),
    pluto:   env('PLUTO_URL', 'http://localhost:8008'),
    themis:  env('THEMIS_URL', 'http://localhost:8009'),
    mercury: env('MERCURY_URL', 'http://localhost:8005'),
  };
}
