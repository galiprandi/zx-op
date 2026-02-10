# 🚀 Inicio Rápido - Zona Xtreme

## 📱 Acceso desde Dispositivos Móviles

### 1. Iniciar Servidor (con certificados automáticos)
```bash
cd ui
npm run dev:https
```

### 2. URL para Móviles
```
https://192.168.68.58:3000/
```

### 3. Aceptar Certificado (NORMAL)

**Chrome:**
- Tocar "Avanzado" 
- Tocar "Continuar a 192.168.68.58 (no seguro)"

**Safari:**
- Tocar "Mostrar detalles"
- Tocar "Visitar este sitio web"

### 4. Permitir Cámara
- Cuando la app solicite permiso, tocar "Permitir"

## ✨ Características Automáticas

- **🔄 Certificados nuevos cada sesión** - Nunca tendrás problemas de certificados expirados
- **📱 Compatible con móviles** - Funciona en Chrome, Safari, etc.
- **🔐 SSL seguro para desarrollo** - Certificados auto-firmados válidos por 1 año

## ⚠️ Importante

- **La advertencia "Tu conexión no es privada" es NORMAL**
- **Es un certificado auto-firmado para desarrollo**
- **No hay riesgo real de seguridad en tu red local**
- **Los certificados se regeneran automáticamente cada vez**

## 🔧 Si no funciona

1. **Verificar WiFi:** Asegurar que el móvil esté en la misma red
2. **Recargar página:** Después de aceptar el certificado
3. **Permisos:** Revisar configuración de cámara del móvil
4. **IP correcta:** Usar la IP que muestra Vite al iniciar

## 📞 Comandos Útiles

```bash
# Iniciar con HTTPS y certificados automáticos
npm run dev:https

# Iniciar normal (sin HTTPS)
npm run dev

# Generar certificados manualmente
cd certs && ./generate-cert.sh
```

## 📋 Soporte

Ver `MOBILE-ACCESS.md` para instrucciones detalladas.
