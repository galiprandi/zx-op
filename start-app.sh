#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Avoid interactive prompts from Corepack and ensure pnpm path is available.
export COREPACK_ENABLE_DOWNLOAD_PROMPT=0
export PNPM_HOME="${PNPM_HOME:-$HOME/.local/share/pnpm}"
export PATH="$PNPM_HOME:$PATH"

LOG_DIR="$SCRIPT_DIR/ops/logs"
mkdir -p "$LOG_DIR"

declare -a SYSTEMCTL_CMD
if [[ -n "${SYSTEMCTL_BIN:-}" ]]; then
  # Allow overriding the systemctl command (e.g., "sudo systemctl").
  read -r -a SYSTEMCTL_CMD <<<"$SYSTEMCTL_BIN"
else
  if [[ $EUID -eq 0 ]]; then
    SYSTEMCTL_CMD=(systemctl)
  else
    SYSTEMCTL_CMD=(sudo systemctl)
  fi
fi

systemctl_run() {
  "${SYSTEMCTL_CMD[@]}" "$@"
}

# Update or append a key=value pair inside the local .env file.
upsert_env_var() {
  local key="$1"
  local value="$2"
  local tmp_file

  if [[ -f .env ]]; then
    if grep -q "^${key}=" .env; then
      tmp_file=$(mktemp)
      awk -v KEY="$key" -v VALUE="$value" 'index($0, KEY "=")==1 {print KEY "=" VALUE; next} {print}' .env > "$tmp_file"
      mv "$tmp_file" .env
    else
      printf '%s=%s\n' "$key" "$value" >> .env
    fi
  else
    printf '%s=%s\n' "$key" "$value" > .env
  fi
}

# Detect the primary local IP address for Linux/macOS.
detect_ip() {
  local os_name
  os_name=$(uname -s)
  local ip=""

  case "$os_name" in
    Linux*)
      ip=$(hostname -I 2>/dev/null | awk '{print $1}')
      ;;
    Darwin*)
      if command -v ipconfig >/dev/null 2>&1; then
        for iface in en0 en1; do
          ip=$(ipconfig getifaddr "$iface" 2>/dev/null || true)
          [[ -n "$ip" ]] && break
        done
      fi
      ;;
  esac

  if [[ -z "$ip" ]]; then
    ip="127.0.0.1"
  fi

  echo "$ip"
}

IP=$(detect_ip)
upsert_env_var "PUBLIC_API_BASE_URL" "http://$IP"

get_env_var() {
  local key="$1"
  if [[ -f .env ]]; then
    local line
    line=$(grep -m1 "^${key}=" .env || true)
    if [[ -n "$line" ]]; then
      local value="${line#*=}"
      value="${value%\"}"
      value="${value#\"}"
      echo "$value"
      return
    fi
  fi
  echo ""
}

wait_for_postgres() {
  local db_url
  db_url=$(get_env_var "DATABASE_URL")
  if [[ -z "$db_url" ]]; then
    db_url="postgresql://zx_user:zx_password@localhost:5432/zx_op"
  fi

  echo "Esperando a que PostgreSQL esté listo..."
  for i in {1..20}; do
    if pg_isready -d "$db_url" >/dev/null 2>&1; then
      echo "PostgreSQL listo."
      return
    fi
    sleep 2
  done
  echo "PostgreSQL no respondió a tiempo" >&2
  exit 1
}

run_step() {
  local message="$1"
  shift
  echo "==> $message"
  "$@"
}

ensure_postgres() {
  if ! systemctl_run is-active --quiet postgresql; then
    echo "PostgreSQL no está activo. Iniciando servicio..."
    systemctl_run start postgresql
  fi
  wait_for_postgres
}

run_step "Instalando dependencias" pnpm install --frozen-lockfile
ensure_postgres
run_step "Generando cliente de Prisma" pnpm --filter api db:generate
run_step "Aplicando migraciones" pnpm --filter api exec prisma migrate deploy
run_step "Compilando API" pnpm --filter api build
run_step "Compilando UI" pnpm --filter ui build
run_step "Recargando unidades systemd" systemctl_run daemon-reload
run_step "Reiniciando zx-api.service" systemctl_run restart zx-api.service
run_step "Reiniciando zx-ui.service" systemctl_run restart zx-ui.service

# Basic health checks after startup with retries.
echo "Esperando a que la API esté lista..."
for i in {1..10}; do
  if curl -fsS http://127.0.0.1:3000/api/health >/dev/null; then
    echo "API Saludable!"
    break
  fi
  echo "Reintentando salud de la API... ($i/10)"
  sleep 3
done

echo "Esperando a que la UI esté lista..."
for i in {1..5}; do
  if curl -fsS http://127.0.0.1:4173/ >/dev/null; then
    echo "UI Saludable!"
    break
  fi
  echo "Reintentando salud de la UI... ($i/5)"
  sleep 2
done
