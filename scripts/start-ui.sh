#!/bin/bash
set -euo pipefail

# Cargar entorno de NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Configurar PNPM
export PNPM_HOME="$HOME/.local/share/pnpm"
export PATH="$PNPM_HOME:$PATH"

cd /home/zx/zx-op

# Ejecutar preview de la UI
exec pnpm --filter ui preview --host 0.0.0.0 --port 8080
