# Changelog — solar-ui (R5)

Todas as mudanças notáveis deste projeto serão documentadas neste arquivo.

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/);
versionamento segue [SemVer](https://semver.org/lang/pt-BR/) unificado para o
monorepo inteiro (não independente por package). Política completa em
`VERSIONING.md`.

---

## [0.1.7] — 2026-05-28

Hot-fix Resources — CR36a: Sun `/v1/resources` retorna array nu; R5
ResourcesPage e TaskSubmitWizard esperam PaginatedResponse. Mesmo
pattern de CR28 (Bundle 6 F21) e CR29 (Bundle 7 F23) — adapter
centralizado em service. Fecha incompletude do Bundle 7 F27.

Decisão em `cross-repo-adrs/maps/r5-fix-bundle-8-brief-for-code.md`
+ mapa de contratos (CR36a). CR36b (tenant_id UUID format) NÃO está no
escopo deste bundle — resolvido por test-data + CR1 produção.

### Fixed

- **CR36a** — `services/sun.ts → resources.list` agora envolve o array
  Sun em `PaginatedResponse{items, total, page, page_size}`. Type
  Resource inalterado. ResourcesPage + TaskSubmitWizard renderizam
  items corretamente. (`2790d33`)

### Deferred

- **CR36b** — Sun exige `tenant_id` em UUID válido (não-UUID → 500).
  Resolução: test-data (operador injeta UUID real) + produção via
  CR1 (Pluto session-mint emitirá JWT com tenant_id UUID). Não é
  fix R5 (não derivar uuid5 client-side).
- CR34, CR35 (Bundle 7), CR1, CR5/CR20(re), CR23, CR24, CR6-CR13.

---

## [0.1.6] — 2026-05-28

Fix bundle 7 — fecha 5 drifts cross-repo expostos no Bloco I (smoke
sistemático pós-v0.1.5). Princípio consistente: descartar inventado,
adapter para shape, stub páginas afetadas, fix params.

Decisão em `cross-repo-adrs/maps/r5-fix-bundle-7-brief-for-code.md`
+ mapa de contratos (CR29-CR33).

### Fixed

- **CR32** — `ParameterEditor` envolvido com `<Providers>` (regressão
  CR17 não-coberta no Bundle 4 F7b). useToast funciona em hydration.
  (`48123b6`)
- **CR33** — `TaskSubmitWizard` + `ResourcesPage` passam `tenant_id`
  da session em `solar.sun.resources.list()` + `enabled` gate. Sun
  exige tenant_id required (ADR-007 §D5); sem ele → 422. (`a127204`)

### Changed

- **CR29** — `services/neptune.ts` adicionou `adaptProvider` helper
  mapeando `name→display_name`, `url→base_url`, `created_at→registered_at`,
  `model_count: 0` default. ProviderList renderiza fields populados.
  (`7e5f65f`)

### Removed

- **CR29** — `services/neptune.ts → providers.sync` removido + botões
  Discover/Health em ProviderList. Neptune publica `/health` e
  `/discover`, não `/sync` (R5 inventou). (`7e5f65f`)
- **CR30** — `services/neptune.ts → models.listQuality` removido. Neptune
  publica `/v1/models/{id}/quality` (por ID), não list. QualityAnalytics
  virou stub honest (CR35 aberto). (`2b9abb6`)
- **CR31** — `services/themis.ts` reduzido para `health` + `criteria.list`
  (únicos endpoints que Themis publica entre os que R5 esperava).
  Removidos: shadow.{recommend,list}, aura.{evaluate,get},
  divergence.{analyze,list}, criteria.evaluate. ThemisShadow virou stub
  honest (CR34 aberto). (`7c37724`)

### Nota de discrepância (vs. brief F25)

- **QualityGates** e **AdequationDashboard** NÃO foram stubados. O brief
  assumiu dependência de Themis, mas ambos usam `mars.executions.list`
  (refs a `themis` são só cor CSS). Stubar removeria feature funcional
  = regressão. Mantidos intactos. `themis.health` preservado (usado por
  ControlOverview/EngineeringTopology/ServiceDetail).

### Deferred (carry-overs registrados)

- **CR34** (novo) — ADR R3 para "API REST canônica de Themis"
  (recognition, aura/envelope, aura/finalize, recommend/task vs. o que
  R5 espera). Requer alinhamento com 4R-methodology.
- **CR35** (novo) — Implementar `GET /v1/models/quality` (list) em
  Neptune se feature for relevante para UI.
- Carry-overs anteriores: CR1, CR5(re), CR20(re), CR23, CR24, CR6-CR13.

---

## [0.1.5] — 2026-05-28

Hot-fix Skills — CR28: Sun `/v1/skills` shape divergente quebrava
SkillCatalog (TypeError em `compatible_tiers.map`). Mesmo pattern de
CR26 (Bundle 4 F13) — adapter centralizado em service. Detectado em
smoke ad-hoc do operador pós-Bundle 5.

Decisão em `cross-repo-adrs/maps/r5-fix-bundle-6-brief-for-code.md`
+ mapa de contratos (CR28).

### Fixed

- **CR28** — `services/sun.ts → skills.list/get` agora traduz shape
  Sun (sem `version` nem `compatible_tiers`) para `Skill` R5 com
  defaults (`version: '1.0'`, `compatible_tiers: ['standard']`) via
  helper `adaptSkill`. Type Skill inalterado. SkillCatalog renderiza
  sem TypeError. (`b78b4b6`)

---

## [0.1.4] — 2026-05-27

Hot-fix UI — Tailwind v4 não escaneava classes de `@solar/ui`,
causando layout quebrado em todas as pages (Sidebar amontoado, fonte
pequena, ícones reduzidos). Bug puramente CSS — Bundle 4 (CR26)
permanece funcional. Detectado em Bloco H validation 2026-05-27.

Decisão em `cross-repo-adrs/maps/r5-fix-bundle-5-brief-for-code.md`
+ mapa de contratos (CR27).

### Fixed

- **CR27** — `packages/ui/src/styles/globals.css` agora declara
  `@source "../**/*.ts"` + `@source "../**/*.tsx"` para que Tailwind
  v4 escaneie components de `@solar/ui`. Sem isso, classes em
  AppShell/Sidebar/etc viravam no-op no CSS final dos 3 portais.
  Nota: Tailwind v4 não aceita brace expansion `{ts,tsx}` em `@source`
  (parser interpreta como CSS declaration); globs separados resolvem.
  CSS compilado expandiu de residual para ~26KB por portal (esperado —
  utility classes que faltavam passam a ser geradas). (`7f83ecc`)

---

## [0.1.3] — 2026-05-27

Fix bundle 4 — hot-fix de shape Nível 2 (CR26) + descartes consistentes
com Bundle 3 (CR3, CR5) + drift routing (CR2) + sentinela contra
regressão (CR18). Princípio mantido: descartar inventado, fix paths
errados, stub páginas dependentes, proteger conventions.

Decisões em `cross-repo-adrs/maps/r5-fix-bundle-4-brief-for-code.md`
+ mapa de contratos (CR2/CR3/CR5/CR18/CR26).

### Fixed

- **CR26** — Adapter Moon audit em `services/moon.ts` agora traduz
  shape de **item individual** (não só wrapper, que foi v0.1.2 F8).
  Moon retorna `{audit_id, event, detail, content_hash, occurred_at, ...}`;
  R5 AuditRecord espera `{record_id, event_type, payload, hash,
  created_at, ...}`. Mapping baseado em shape capturado via curl
  pré-fix (`audit_id→record_id`, `event→event_type`, `detail→payload`,
  `content_hash→hash`, `occurred_at→created_at`, `exec_id→task_id`,
  `planet_source:='moon'`). Console `/audit/` não crasha; engineering
  `/audit` renderiza colunas populadas. (`263901e`)

### Changed

- **CR2** — `solar.saturn.executions.list` movido para
  `solar.mars.executions.list`. Saturn não publica `/v1/executions`;
  Mars publica com filtros superset. Caller único atualizado:
  `apps/console/src/components/account/ApiKeysPage.tsx:59`. (`24c1dde`)

### Removed

- **CR3** — `services/saturn.ts → audit.{emit,list}` removidos. Era
  código morto (zero callers verified via grep). Emit real vai via
  Moon `/v1/audit/records` per ADR-008; list via `moon.audit.list`
  (corrigida em v0.1.2 F8 + v0.1.3 F13). (`9bb2ed3`)
- **CR5** — `services/saturn.ts → admin.getConfig/setConfig` removidos.
  R5 inventou (Saturn não publica `/v1/admin/config`); usavam-se como
  workaround para tenant mgmt. `TenantList` + `TenantDetail` (control)
  viraram stubs honest com AlertBanner "Backend em construção"
  apontando CR5/CR20 abertos. ParameterEditor (engineering) intacto
  (usa dados hardcoded; não dependia destes). (`3e2ac55`)

### Added

- **CR18** — `scripts/check-portal-base.sh` + integração ao
  `npm run lint`. Sentinela contra regressão de PORTAL_BASE
  convention instituída no Bundle 2 F6 b+c. Falha com mensagem clara
  se algum component em `apps/{control,engineering}/` usar href
  absoluto sem prefix de portal. Standalone: `npm run check-portal-base`.
  (`8033cd3`)

### Deferred (carry-overs registrados)

- **CR5/CR20** (re-abertos) — ADR R3 para endpoint REST de tenant mgmt
  (leitura/listagem) + ledger.
- **CR1** — Pluto `/v1/sessions/refresh` (alinhado ADR-016 Phase 3).
- **CR23** — Padronizar `/health` em Venus/Neptune (R3).
- **CR24** — Implementar `GET /v1/tokens/{id}` em Pluto (na spec §7.1).
- CR6-CR13 — outros carry-overs abertos no mapa.

---

## [0.1.2] — 2026-05-27

Fix bundle 3 — corrige 4 drifts cross-repo expostos em Bloco D
(navegação end-to-end com session real) + 1 drift estrutural
identificado em drill-down. Princípio operador: **descartar** o que
R5 inventou sem spec/ADR R3; **stub** o que está em spec mas não
implementado; **fix** paths errados; **workaround** inconsistências
internas R3.

Decisões em
`cross-repo-adrs/maps/r5-fix-bundle-3-brief-for-code.md` + mapa
de contratos (CR4, CR20-CR25).

### Fixed

- **CR4** — `services/moon.ts → audit.list` chamava `/v1/audit` (404).
  Moon publica em `/v1/audit/records/search`. Adapter local traduz
  shape `{records, total}` → `PaginatedResponse{items, total, page,
  page_size}` e params `page/page_size` → `limit/offset` (+ `task_id`
  → `exec_id`). Preserva interface dos callers (PlatformAudit, AuditPage)
  sem mudança neles. Adicionado `byTask(taskId)`. (`6f61b9e`)

### Removed

- **CR20 + CR25** — `services/mars.ts → budget.{get|ledger|grant|reset}`
  removidos. R5 inventou semantic per-tenant; Mars publica budget
  per-`exec_id` (spec, `routes.py:483`) e Saturn não expõe
  `budget_ledger` via REST. `BillingPage` virou stub com AlertBanner
  "Backend em construção" apontando CR20 aberto. `TenantDetail` aba
  Budget idem (scope expansion documentada no commit). (`18c2e9d`)
- **CR22** — `services/pluto.ts → tokens.list` removido (R5 inventou,
  fora da spec Pluto §7.1). `tokens.get` comentado aguardando R3
  (CR24 aberto). `SecurityConsole` aba Tokens vira AlertBanner stub;
  Mint modal + Revoke ConfirmDialog removidos (sem lista pra invocar).
  Outras abas (Certificates, Access, Anomalies) intactas. (`c99bdd7`)

### Changed

- **CR21** — `services/venus.ts` e `services/neptune.ts` chamam
  `/v1/health` (Venus/Neptune servem em `/v1/health`; demais planetas
  servem em `/health`). Quando R3 padronizar (CR23 aberto), voltar
  para `/health` nos 2 lugares. (`9e8a1ee`)

### Deferred (carry-overs registrados)

- **CR20** — ADR R3 para endpoint REST de budget/ledger (Saturn ou Mars?).
- **CR23** — Padronização de health path em R3 (Venus/Neptune servir
  também em `/health`).
- **CR24** — Implementar `GET /v1/tokens/{id}` em Pluto (na spec
  §7.1; falta código em `routes_tokens.py`).
- CR1-CR3, CR5-CR13, CR18 — outros carry-overs abertos no mapa.

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

[0.1.7]: https://github.com/fuzaro/solar-ui/releases/tag/v0.1.7
[0.1.6]: https://github.com/fuzaro/solar-ui/releases/tag/v0.1.6
[0.1.5]: https://github.com/fuzaro/solar-ui/releases/tag/v0.1.5
[0.1.4]: https://github.com/fuzaro/solar-ui/releases/tag/v0.1.4
[0.1.3]: https://github.com/fuzaro/solar-ui/releases/tag/v0.1.3
[0.1.2]: https://github.com/fuzaro/solar-ui/releases/tag/v0.1.2
[0.1.1]: https://github.com/fuzaro/solar-ui/releases/tag/v0.1.1
[0.1.0]: https://github.com/fuzaro/solar-ui/releases/tag/v0.1.0
