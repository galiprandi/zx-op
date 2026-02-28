#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SUDOERS_FILE="$SCRIPT_DIR/sudoers-zx"
TARGET_SUDOERS="/etc/sudoers.d/zx-op"

echo "Configurando permisos de sudo para el usuario zx..."

# Verificar si el archivo sudoers ya existe
if [[ -f "$TARGET_SUDOERS" ]]; then
    echo "El archivo $TARGET_SUDOERS ya existe. Verificando contenido..."
    if sudo diff "$SUDOERS_FILE" "$TARGET_SUDOERS" >/dev/null 2>&1; then
        echo "Los permisos de sudo ya están configurados correctamente."
    else
        echo "Actualizando configuración de sudo..."
        sudo cp "$SUDOERS_FILE" "$TARGET_SUDOERS"
        sudo chmod 440 "$TARGET_SUDOERS"
        echo "Permisos de sudo actualizados."
    fi
else
    echo "Instalando configuración de sudo..."
    sudo cp "$SUDOERS_FILE" "$TARGET_SUDOERS"
    sudo chmod 440 "$TARGET_SUDOERS"
    echo "Permisos de sudo instalados."
fi

# Verificar que la configuración es válida
echo "Verificando configuración de sudo..."
if sudo visudo -c -f "$TARGET_SUDOERS"; then
    echo "✓ Configuración de sudo válida"
else
    echo "✗ Error en la configuración de sudo"
    exit 1
fi

echo "Permisos configurados correctamente. El usuario zx ahora puede reiniciar los servicios."
