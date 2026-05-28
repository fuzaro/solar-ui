#!/usr/bin/env bash
# Sentinela CR18 — detecta hrefs absolutos sem PORTAL_BASE prefix em
# apps/control/ e apps/engineering/, que devem usar `${PORTAL_BASE}/...`
# por convenção (instituída em Bundle 2 F6 b+c).
#
# Padrão proibido (exemplos):
#   <a href="/agents">                      → falha
#   window.location.href = '/models'        → falha
#   href={`/skills?detail=${id}`}           → falha
#
# Padrão correto:
#   const PORTAL_BASE = '/control';
#   <a href={`${PORTAL_BASE}/agents`}>      → ok
#   href="/"                                → ok (raiz é intencional)
#
# Convention: declarar PORTAL_BASE local no topo do arquivo e usar
# template literal. Ver CR18 do mapa de contratos.

set -e

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FAILED=0

check_portal() {
  local PORTAL_DIR="$1"
  local SEARCH_PATH="${REPO_ROOT}/${PORTAL_DIR}/src/components"
  [ -d "$SEARCH_PATH" ] || return 0

  # Padrões proibidos: href="/x", href='/x', href=`/x, window.location.href = '/x'
  # Excluir: href="/" (raiz intencional), linhas com PORTAL_BASE, comentários
  local FORBIDDEN
  FORBIDDEN=$(grep -rnE 'href=("|'"'"')/[a-z]|window\.location\.href[[:space:]]*=[[:space:]]*("|'"'"')/[a-z]|href=`/[a-z]' "$SEARCH_PATH" 2>/dev/null \
    | grep -v 'PORTAL_BASE' \
    | grep -vE 'href=("|'"'"')/("|'"'"')' \
    || true)

  if [ -n "$FORBIDDEN" ]; then
    echo "❌ CR18 — hrefs absolutos sem PORTAL_BASE em $PORTAL_DIR:"
    echo "$FORBIDDEN"
    FAILED=1
  fi
}

check_portal "apps/control"
check_portal "apps/engineering"
# apps/console é raiz — não precisa prefix

if [ $FAILED -eq 1 ]; then
  echo ""
  echo "Convention: declare 'const PORTAL_BASE = \"/<portal>\";' local no"
  echo "topo do arquivo e use \`\${PORTAL_BASE}/path\`. Ver CR18 do mapa"
  echo "de contratos e Bundle 2 F6 b+c."
  exit 1
fi

echo "✅ CR18 — todos os hrefs em apps/{control,engineering}/ usam PORTAL_BASE"
exit 0
