#!/bin/bash
set -euo pipefail

APP_DIR="/home/zx/zx-op"
cd "$APP_DIR"

# Detect the primary local IP address.
IP=$(hostname -I | awk '{print $1}')

# Upsert PUBLIC_API_BASE_URL without dropping existing settings.
if [[ -f .env ]]; then
  if grep -q '^PUBLIC_API_BASE_URL=' .env; then
    sed -i "s|^PUBLIC_API_BASE_URL=.*|PUBLIC_API_BASE_URL=http://$IP|" .env
  else
    echo "PUBLIC_API_BASE_URL=http://$IP" >> .env
  fi
else
  echo "PUBLIC_API_BASE_URL=http://$IP" > .env
fi

# Keep database service available before running migrations.
docker compose up -d postgres

# Generate Prisma client and run safe production migrations.
docker compose run --rm api pnpm --filter api db:generate
docker compose run --rm api pnpm --filter api exec prisma migrate deploy

# Start or rebuild application containers.
docker compose up -d --build api ui

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

