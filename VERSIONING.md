# Versionamento — solar-ui (R5)

Política de versionamento e release deste repositório. Faz parte da
disciplina cross-repo do ecossistema SolarSystemsAI; ver
`../cross-repo-adrs/ADR-001-r5-incorporation.md` para contexto e
amarração com R3.

---

## Modelo

**Unified SemVer.** R5 é versionado como um produto único — não como
um conjunto de packages independentes — porque deploya como um
container único (Dockerfile + nginx + nomad job spec). A tag git no
root é o único anchor de release.

- `MAJOR` — breaking change na API contract dos portais (rota
  removida, payload incompatível) ou no contrato com R3 que quebre
  consumers.
- `MINOR` — feature nova end-to-end (portal novo, fluxo novo, novo
  consumo de planeta de R3).
- `PATCH` — fix de bug, melhoria interna, ajuste de build/deploy sem
  mudança observável de funcionalidade.

Pre-1.0 (atual): aceitamos quebras de contrato em bumps `MINOR`. A
linha vermelha de 1.0 será cruzada quando R5 for declarado estável
para uso externo (não-time).

Os `package.json` internos (`@solar/api`, `@solar/auth`, `@solar/ui`,
`@solar/console`, `@solar/control`, `@solar/engineering`) **não são
publicados** no npm registry. Suas versões em `package.json` são
mantidas em `0.1.0` por convenção do scaffolding, mas a versão
autoritativa é a do root.

> Se um dia algum `@solar/*` for publicado externamente como lib
> reutilizável, esta política precisa ser revisitada (provavelmente
> migração para Changesets ou similar).

---

## Conventional Commits

Todo commit segue [Conventional Commits 1.0](https://www.conventionalcommits.org/pt-br/v1.0.0/).
Tipos em uso:

- `feat(<scope>):` — feature nova
- `fix(<scope>):` — correção de bug
- `chore(release):` — bump de versão (commit que precede a tag)
- `chore(<scope>):` — manutenção (deps, lint, config)
- `docs(<scope>):` — documentação
- `refactor(<scope>):` — reorganização sem mudança de comportamento
- `test(<scope>):` — testes

Scopes esperados: `api`, `auth`, `ui`, `console`, `control`,
`engineering`, `deploy`, `build`, `nginx`, `nomad`.

Breaking change: linha `BREAKING CHANGE: ...` no footer do commit
(ou `!` após o tipo) — força bump `MAJOR` no próximo release.

---

## Cadência de release

**Bump manual** disparado por critério de pacote (não por calendário
nem por commit individual). Não há automação via release-please ou
semantic-release nesta fase — entra na lista de débitos quando o
volume justificar.

Critério para abrir release:
1. Pelo menos uma feature ou fix entregue, **com smoke test no
   ambiente de container**, OR
2. Demanda explícita de R3 ou de outro repo para citar R5 por tag
   imutável.

Anti-padrão a evitar: bumps "calendário" (release toda sexta) sem
material novo. Isso polui o CHANGELOG e dilui o sinal.

---

## Processo de release (passo a passo)

Pré-requisitos: working tree limpa, `main` atualizado com `origin`,
build verde, container roda.

1. Decidir tipo de bump (`MAJOR`/`MINOR`/`PATCH`) lendo o diff desde
   a última tag (`git log v<anterior>..HEAD --oneline`).
2. Bump em `package.json` root (`"version": "X.Y.Z"`).
3. Atualizar `CHANGELOG.md` movendo entradas da seção "Não publicado"
   para nova seção `[X.Y.Z] — AAAA-MM-DD`.
4. Commit: `chore(release): vX.Y.Z`.
5. Tag anotada: `git tag -a vX.Y.Z -m "release vX.Y.Z — <resumo>"`.
6. Push: `git push origin main vX.Y.Z` (ou `git push --follow-tags`).
7. (Opcional) Criar Release no GitHub linkando ao CHANGELOG.

---

## Citação cross-repo

R5 é citado por outros repos do ecossistema (notavelmente R3) **por
tag imutável**, não por SHA nem por branch.

- Forma correta: `solar-ui@v0.1.0`
- Forma aceitável em fase pré-tag (não usar mais a partir desta v0.1.0): `solar-ui@<sha-curto>`
- Forma incorreta sempre: `solar-ui@main`, `solar-ui@HEAD`

ADRs do R3 que introduzem dependência sobre R5 devem citar a tag
mínima requerida na seção "Cross-repo impact".

---

## Riscos conhecidos desta política

1. **Bump manual depende de disciplina humana.** Se acumular muitas
   features sem release, a citabilidade trava. Mitigação: estabelecer
   bump como parte do "definition of done" de qualquer entrega que
   afete contract externo.

2. **`@solar/*` em versão estática (`0.1.0`) cria mentira silenciosa.**
   Quem ler `package.json` de `@solar/api` vai assumir que está em
   0.1.0 mesmo depois do root subir para 0.5.0. Mitigação: documentar
   aqui (acima) e considerar bump sincronizado se o consumo interno
   crescer.

3. **Workspace pai (`SolarSystemsAI/`) não é git.** A ADR cross-repo
   vive em diretório não-versionado. Fragilidade conhecida — ver
   `../cross-repo-adrs/README.md` (quando criado) para discussão de
   migração futura.

---

*Versão desta política: 1.0 — 2026-05-27. Revisar quando: (a) primeiro
`@solar/*` for publicado externamente, (b) volume de releases passar
de 1/mês, (c) houver mais de um consumer externo de R5.*
