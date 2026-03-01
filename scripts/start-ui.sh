#!/bin/bash
set -euo pipefail

# Cargar entorno de NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Configurar PNPM
export PNPM_HOME="$HOME/.local/share/pnpm"
export PATH="$PNPM_HOME:$PATH"

# IMPORTANT: API is always at 192.168.100.2:3000
export VITE_API_BASE_URL="http://192.168.100.2"
export VITE_API_BASE_PORT="3000"
export VITE_API_SOCKET_PORT="3000"

cd /home/zx/zx-op

# Ejecutar preview de la UI en puerto 8080
exec pnpm --filter ui preview --host 0.0.0.0 --port 8080
