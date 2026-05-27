# Changelog — solar-ui (R5)

Todas as mudanças notáveis deste projeto serão documentadas neste arquivo.

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/);
versionamento segue [SemVer](https://semver.org/lang/pt-BR/) unificado para o
monorepo inteiro (não independente por package). Política completa em
`VERSIONING.md`.

---

## [0.1.0] — 2026-05-27

Primeiro release marcado de R5. Consolida os 16 commits iniciais
(2026-05-23 → 2026-05-24) que estabeleceram o monorepo, os três portais,
os packages internos e a pipeline de container + deploy Nomad.

Marca a incorporação formal de R5 como parte integrante da plataforma
SolarSystemsAI per `cross-repo-adrs/ADR-001-r5-incorporation.md`.

### Added

- **Monorepo turbo + npm workspaces** com `apps/*` e `packages/*`
  (commit `cdcc6f0`).
- **Packages internos** `@solar/api`, `@solar/auth`, `@solar/ui`
  (design system com 40+ componentes, planet theming, AURA status bands;
  API clients tipados para os 8 serviços-planeta; sessão JWT Saturn com
  context React).
- **`@solar/api`** — types para balance gate, envelope override, FGA
  grants (`56910ef`); endpoints Saturn envelope/FGA/billing + Venus 402
  handling (`83677d4`).
- **`@solar/engineering`** — workflow de reconciliação de débito órfão
  (`7d771b8`).
- **`@solar/console`** — handling de 402 balance gate com UI de recarga
  (`9dba7f8`).
- **`@solar/control`** — matriz de grant/revoke FGA por skill
  (`7c49989`); editor de envelope override com labels de enforcement
  (`7515350`).

### Infrastructure

- **Deploy Nomad** — Dockerfile + nginx + job spec + Makefile
  (`2a5dab3`).
- **Vault** — policy + JWT role setup para solar-ui (`76426cd`).
- **Container runtime config injection** — env vars de container +
  base path routing (`03ea52d`).
- **packageManager pinned** (`npm@11.14.1`) + upgrade de npm no Docker
  builder stage (`429e0f8`).

### Fixed

- **Static build** — output estático para deploy em container nginx
  (`63480eb`); `client:only=react` para pular SSR pre-rendering em modo
  static (`b2212b3`); rota dinâmica `[id]` substituída por página de
  detalhe estática no console (`b66a914`).
- **Nginx** — single server block com path routing + sync de mapeamento
  de porta no spec Nomad (`e372886`).

---

## Não publicado

Próximas mudanças (entre releases) acumulam aqui até o próximo bump.

[0.1.0]: https://github.com/fuzaro/solar-ui/releases/tag/v0.1.0
