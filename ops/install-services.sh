#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

SYSTEMD_DIR="/etc/systemd/system"
SERVICES=("zx-api.service" "zx-ui.service")

echo "Instalando servicios systemd para Zona Xtreme..."

for svc in "${SERVICES[@]}"; do
  src="$PROJECT_DIR/ops/systemd/$svc"
  dst="$SYSTEMD_DIR/$svc"

  if [[ ! -f "$src" ]]; then
    echo "ERROR: No se encuentra $src" >&2
    exit 1
  fi

  echo "Copiando $svc a $SYSTEMD_DIR"
  sudo cp "$src" "$dst"
  sudo chmod 644 "$dst"
done

echo "Recargando systemd y habilitando servicios..."
sudo systemctl daemon-reload
sudo systemctl enable zx-api.service zx-ui.service

echo "Servicios instalados. Para iniciar manualmente:"
echo "  sudo systemctl start zx-api.service zx-ui.service"
echo "Para ver estado:"
echo "  systemctl status zx-api.service zx-ui.service"
