/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly VENUS_URL: string;
  readonly SATURN_URL: string;
  readonly NEPTUNE_URL: string;
  readonly SUN_URL: string;
  readonly MOON_URL: string;
  readonly PLUTO_URL: string;
  readonly THEMIS_URL: string;
  readonly MARS_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
