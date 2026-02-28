# Configuración de Permisos Systemd para ZX-OP

## Problema

El deployment falla al reiniciar los servicios systemd porque el usuario `zx` no tiene permisos para ejecutar `systemctl` sin contraseña.

## Solución

### Opción 1: Automática (Recomendada)

Ejecutar el script de configuración como root:

```bash
sudo /home/zx/zx-op/ops/setup-sudo.sh
```

### Opción 2: Manual

Copiar el archivo de configuración de sudoers:

```bash
sudo cp /home/zx/zx-op/ops/sudoers-zx /etc/sudoers.d/zx-op
sudo chmod 440 /etc/sudoers.d/zx-op
```

### Opción 3: Directamente en el servidor

Editar el archivo sudoers:

```bash
sudo visudo -f /etc/sudoers.d/zx-op
```

Y agregar el contenido del archivo `ops/sudoers-zx`.

## Verificación

Para verificar que los permisos están configurados correctamente:

```bash
sudo -n systemctl restart zx-api.service
```

Si el comando se ejecuta sin pedir contraseña, los permisos están correctos.

## Permisos Configurados

El usuario `zx` podrá ejecutar sin contraseña:
- `systemctl restart zx-api.service`
- `systemctl restart zx-ui.service`
- `systemctl status zx-api.service`
- `systemctl status zx-ui.service`
- `systemctl daemon-reload`
- `systemctl start postgresql`
- `systemctl is-active postgresql`

## Notas Importantes

- Los permisos se aplican solo al usuario `zx`
- El archivo `/etc/sudoers.d/zx-op` debe tener permisos 440
- La configuración es validada automáticamente por el script de instalación
- Si hay problemas, revisar los logs de systemd: `journalctl -u zx-api.service`
