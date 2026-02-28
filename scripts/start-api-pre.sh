#!/bin/bash
set -euo pipefail

# Cargar entorno de NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Configurar PNPM
export PNPM_HOME="$HOME/.local/share/pnpm"
export PATH="$PNPM_HOME:$PATH"

cd /home/zx/zx-op

# Generar cliente de Prisma
pnpm --filter api db:generate

# Aplicar migraciones
pnpm --filter api exec prisma migrate deploy
