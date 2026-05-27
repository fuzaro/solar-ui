# Changelog — solar-ui (R5)

Todas as mudanças notáveis deste projeto serão documentadas neste arquivo.

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/);
versionamento segue [SemVer](https://semver.org/lang/pt-BR/) unificado para o
monorepo inteiro (não independente por package). Política completa em
`VERSIONING.md`.

---

## [0.1.1] — 2026-05-27

Fix bundle 2 — corrige 4 bugs estruturais descobertos no smoke pós-deploy
de v0.1.0 (homolab 192.168.15.11:3080). Sem mudança de funcionalidade.
Decisões em `cross-repo-adrs/maps/r5-fix-bundle-2-brief-for-code.md`
+ `r5-fix-bundle-2-patch-1-after-f5.md`.

### Fixed

- **CR15** — nginx vazava porta interna `:8080` em `Location:` headers
  de auto-redirects (NAT Nomad 3080→8080). `port_in_redirect off` +
  `absolute_redirect off` no http{} block (`537ec10`).
- **CR17** — `ToastProvider` ausente em `Providers.tsx` causava hard
  throw `useToast must be used within <ToastProvider>` em qualquer
  action que disparasse toast em React island isolada. Adicionado nos
  3 portais (`93edecc`).
- **CR14** — 9 components (4 control + 5 engineering) usavam `useQuery`
  sem `<Providers>` wrap, crashando com `No QueryClient set` quando
  hidratados como Astro islands. Refactor Content+wrapper (`fd8254d`).
  Sub-components `ReplayControl`/`StepLedger` deixados sem wrap próprio
  (herdam contexto de `ExecutionControl`).
- **CR16** — `NAV_ITEMS` em `ControlShell`/`EngineeringShell` + 10
  hrefs hardcoded em 5 components control apontavam para raiz
  (`/agents`), caindo no portal console quando clicados de dentro de
  `/control/` ou `/engineering/`. Convenção `PORTAL_BASE` local por
  arquivo (`0058e09`).

### Changed

- **Makefile `deploy`** — agora purga job existente (`nomad job stop
  -purge solar-ui`) antes do `nomad job run`, forçando troca de
  container mesmo com tag de imagem fixa (`solar-ui:1.0.0`).

### Deferred (carry-overs registrados)

- **CR18** — convenção/lint rule para hrefs cross-portal (evitar
  regressão futura de PORTAL_BASE). Próximo brief Cowork.
- CR1-CR13 — fora do escopo deste bundle, ver mapa de contratos.

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

[0.1.1]: https://github.com/fuzaro/solar-ui/releases/tag/v0.1.1
[0.1.0]: https://github.com/fuzaro/solar-ui/releases/tag/v0.1.0
