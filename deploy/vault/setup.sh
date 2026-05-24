#!/usr/bin/env bash
# One-shot: create solar-ui Vault policy + JWT auth role.
# Run from solar-ui/ root on the server:
#   export VAULT_ADDR=https://192.168.15.11:8200
#   export VAULT_TOKEN=<admin-token>
#   bash deploy/vault/setup.sh

set -euo pipefail
export VAULT_SKIP_VERIFY=true
VAULT_ADDR="${VAULT_ADDR:-https://192.168.15.11:8200}"
export VAULT_ADDR

echo ">>> Creating policy 'solar-ui' ..."
vault policy write solar-ui deploy/vault/solar-ui.hcl

echo ">>> Creating JWT auth role 'solar-ui' ..."
vault write auth/jwt-nomad/role/solar-ui \
  role_type="jwt" \
  bound_audiences="vault.io" \
  bound_claims_type="glob" \
  "bound_claims[nomad_job_id]=solar-ui" \
  user_claim="nomad_task" \
  token_type="service" \
  token_period="30m" \
  token_explicit_max_ttl="0" \
  token_policies="solar-ui" \
  token_no_default_policy=true

echo ">>> Done. Role 'solar-ui' ready."
echo ">>> Now run: make deploy"
