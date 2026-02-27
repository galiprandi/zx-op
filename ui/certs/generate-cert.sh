#!/bin/bash

# Generar certificado SSL auto-firmado con configuración mejorada
# para desarrollo local en red

echo "🔐 Generando certificado SSL mejorado para desarrollo..."

cd "$(dirname "$0")"

# Crear archivo de configuración para el certificado
cat > cert.conf <<EOF
[req]
distinguished_name = req_distinguished_name
req_extensions = v3_req
prompt = no

[req_distinguished_name]
C = CL
ST = RM
L = Santiago
O = Zona Xtreme
OU = Development
CN = 102.168.100.2

[v3_req]
basicConstraints = CA:FALSE
keyUsage = digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth, clientAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = *.local
IP.1 = 127.0.0.1
IP.2 = 102.168.100.2
IP.3 = 192.168.1.1
IP.4 = 10.0.0.1
IP.5 = 172.16.0.1
EOF

# Generar el certificado
openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -nodes -config cert.conf -extensions v3_req

echo "✅ Certificado generado con configuración mejorada"
echo "📱 Ahora incluye IPs locales para facilitar acceso desde móviles"

# Limpiar archivo de configuración
rm cert.conf
