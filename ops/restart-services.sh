#!/bin/bash
set -euo pipefail

SERVICES=("zx-api.service" "zx-ui.service")

echo "Reiniciando servicios de Zona Xtreme..."

for svc in "${SERVICES[@]}"; do
  echo "==> Reiniciando $svc"
  if sudo systemctl restart "$svc"; then
    echo "$svc reiniciado correctamente"
  else
    echo "ERROR al reiniciar $svc" >&2
    exit 1
  fi
done

echo "Verificando estado..."
for svc in "${SERVICES[@]}"; do
  status=$(systemctl is-active "$svc")
  echo "$svc: $status"
done

echo "Logs recientes:"
for svc in "${SERVICES[@]}"; do
  echo "--- $svc ---"
  journalctl -u "$svc" --no-pager -n 5
done
