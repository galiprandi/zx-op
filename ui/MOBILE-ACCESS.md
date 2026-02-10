# Acceso desde Dispositivos Móviles

## Configuración HTTPS para Cámara

Para que la cámara funcione desde dispositivos móviles en la red local, la aplicación debe ejecutarse con HTTPS.

### Iniciar servidor con HTTPS

```bash
# Usar el script automático
./start-https.sh

# O iniciar manualmente
npm run dev
```

### URLs de Acceso

El servidor mostrará varias URLs disponibles:

- **Local**: `https://localhost:3000/`
- **Red WiFi**: `https://192.168.68.58:3000/` (para dispositivos móviles)
- **Otras interfaces**: `https://127.0.2.2:3000/`, etc.

### Pasos para Dispositivos Móviles

1. **Conectar el móvil a la misma red WiFi** que el servidor
2. **Abrir la URL HTTPS** en el navegador del móvil:
   ```
   https://192.168.68.58:3000/
   ```
3. **Aceptar la advertencia de seguridad** (certificado auto-firmado)
4. **La cámara debería funcionar** correctamente

### Advertencia de Seguridad

Los navegadores mostrarán una advertencia "Tu conexión no es privada" porque usamos un certificado auto-firmado. Esto es normal en desarrollo.

- **Chrome**: Tocar "Avanzado" → "Continuar a 192.168.68.58 (no seguro)"
- **Safari**: Tocar "Mostrar detalles" → "Visitar este sitio web"

### Solución de Problemas

Si la cámara no funciona:

1. **Verificar que sea HTTPS** (no HTTP)
2. **Aceptar el certificado** auto-firmado
3. **Permisos de cámara**: Asegurar que la app tenga permiso para usar la cámara
4. **Recargar la página** después de aceptar los permisos

### IPs Posibles

Según la configuración de red, las IPs posibles son:
- `192.168.x.x` (red doméstica común)
- `10.x.x.x` (red empresarial)
- `172.16.x.x` (red empresarial)

Usar la IP que muestra Vite al iniciar.
