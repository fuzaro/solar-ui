/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_VENUS_URL: string;
  readonly PUBLIC_SATURN_URL: string;
  readonly PUBLIC_NEPTUNE_URL: string;
  readonly PUBLIC_SUN_URL: string;
  readonly PUBLIC_MOON_URL: string;
  readonly PUBLIC_PLUTO_URL: string;
  readonly PUBLIC_THEMIS_URL: string;
  readonly PUBLIC_MARS_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
