#!/bin/bash

# Script para iniciar el servidor de desarrollo con HTTPS
# Genera certificados nuevos automáticamente cada vez para evitar problemas

echo "🚀 Iniciando servidor de desarrollo con HTTPS..."
echo "📱 Los dispositivos móviles podrán acceder usando la IP local"
echo "🔒 Se generarán certificados SSL frescos automáticamente"
echo ""

cd "$(dirname "$0")"

# Siempre generar certificados nuevos para esta sesión
echo "📋 Generando certificados SSL frescos para esta sesión..."
mkdir -p certs
cd certs
./generate-cert.sh
cd ..

echo ""
echo "🌐 URLs de acceso:"
echo "   Local:     https://localhost:3000/"
echo "   Móviles:   https://102.168.100.2:3000/"
echo ""
echo "⚠️  En móviles verás 'Tu conexión no es privada' - es NORMAL"
echo "   Chrome: 'Avanzado' → 'Continuar a 102.168.100.2 (no seguro)'"
echo "   Safari: 'Mostrar detalles' → 'Visitar este sitio web'"
echo ""
echo "📋 Instrucciones detalladas en: MOBILE-ACCESS.md"
echo ""

# Iniciar el servidor
npm run dev
