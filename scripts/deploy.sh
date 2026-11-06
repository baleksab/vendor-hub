#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$root"

export COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-vendor-hub-stack}"

secret_file="packages/server/.env.secret"
secret_example="packages/server/.env.secret.example"
shell_secret_file="packages/shell/.env.secret"
shell_secret_example="packages/shell/.env.secret.example"

env_files=(
  infra/nginx/.env.local
  packages/server/.env.local
  "$secret_file"
  packages/shell/.env.local
  packages/user-administrator/.env.local
  packages/vendor-administrator/.env.local
)

compose=(docker compose -f docker-compose.yml -f docker-compose.deploy.yml)

for env_file in "${env_files[@]}"; do
  compose+=(--env-file "$env_file")
done

fail() {
  echo "error: $1" >&2
  exit 1
}

env_value() {
  local file="$1" key="$2"

  sed -n "s/^${key}=//p" "$file" | tail -n 1
}

require_docker() {
  command -v docker >/dev/null 2>&1 || fail "docker is not installed"
  docker compose version >/dev/null 2>&1 || fail "docker compose plugin is not available"
  docker info >/dev/null 2>&1 || fail "docker daemon is not running"
}

require_secret() {
  local file="$1" example="$2"

  [[ -f "$file" ]] || fail "$file is missing, copy $example and fill in the values"

  if grep -q "change-me" "$file"; then
    echo "warning: $file still has change-me placeholders, do not use this deployment outside your machine" >&2
  fi
}

require_secrets() {
  require_secret "$secret_file" "$secret_example"
  require_secret "$shell_secret_file" "$shell_secret_example"
}

deploy() {
  require_docker
  require_secrets

  "${compose[@]}" up --build --force-recreate --detach --wait --remove-orphans

  "${compose[@]}" ps

  local domain port

  domain="$(env_value infra/nginx/.env.local SITE_DOMAIN)"
  port="$(env_value infra/nginx/.env.local NGINX_PORT)"

  echo
  echo "Deployed: http://${domain}:${port}"
}

down() {
  require_docker
  require_secrets

  "${compose[@]}" down --remove-orphans
}

case "${1:-deploy}" in
  deploy) deploy ;;
  down) down ;;
  *) fail "unknown command '$1', use: deploy | down" ;;
esac
