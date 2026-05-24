# Vault policy: solar-ui
# Grants read-only access to all backend service URLs
# Apply: vault policy write solar-ui deploy/vault/solar-ui.hcl

path "kv/data/solar/config/venus" {
  capabilities = ["read"]
}
path "kv/data/solar/config/saturn" {
  capabilities = ["read"]
}
path "kv/data/solar/config/sun" {
  capabilities = ["read"]
}
path "kv/data/solar/config/moon" {
  capabilities = ["read"]
}
path "kv/data/solar/config/neptune" {
  capabilities = ["read"]
}
path "kv/data/solar/config/pluto" {
  capabilities = ["read"]
}
path "kv/data/solar/config/mars" {
  capabilities = ["read"]
}
path "kv/data/solar/config/mercury" {
  capabilities = ["read"]
}
path "kv/data/solar/config/themis" {
  capabilities = ["read"]
}

# Metadata paths (required for Vault KV v2)
path "kv/metadata/solar/config/*" {
  capabilities = ["read"]
}

# Token self-management (Nomad renews before expiry)
path "auth/token/renew-self" {
  capabilities = ["update"]
}
path "auth/token/lookup-self" {
  capabilities = ["read"]
}
