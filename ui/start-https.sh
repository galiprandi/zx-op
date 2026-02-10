#!/bin/bash

# Script para iniciar el servidor de desarrollo con HTTPS
# Esto permite el acceso a la cámara desde dispositivos móviles en la red local

echo "🚀 Iniciando servidor de desarrollo con HTTPS..."
echo "📱 Los dispositivos móviles podrán acceder usando la IP local"
echo "🔒 Se usará un certificado auto-firmado (aceptar la advertencia de seguridad)"
echo ""

cd "$(dirname "$0")"

# Verificar que los certificados existan
if [ ! -f "certs/key.pem" ] || [ ! -f "certs/cert.pem" ]; then
    echo "📋 Generando certificados SSL auto-firmados..."
    mkdir -p certs
    cd certs
    ./generate-cert.sh
    cd ..
    echo "✅ Certificados generados"
fi

echo ""
echo "🌐 URLs de acceso:"
echo "   Local:     https://localhost:3000/"
echo "   Móviles:   https://192.168.68.58:3000/"
echo ""
echo "⚠️  En móviles verás 'Tu conexión no es privada' - es NORMAL"
echo "   Chrome: 'Avanzado' → 'Continuar a 192.168.68.58 (no seguro)'"
echo "   Safari: 'Mostrar detalles' → 'Visitar este sitio web'"
echo ""
echo "📋 Instrucciones detalladas en: MOBILE-ACCESS.md"
echo ""

# Iniciar el servidor
npm run dev
