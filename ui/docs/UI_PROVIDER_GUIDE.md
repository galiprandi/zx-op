# Sistema de UI Provider - Guía de Uso

## Overview

El Sistema de UI Provider unifica la gestión de elementos de la interfaz de usuario incluyendo:
- Modales del sistema
- Notificaciones Toast
- Configuración del sistema (nombre del sitio, logo, etc.)
- Estado global de loading
- Theme management

## Arquitectura

### Componentes Principales

1. **UIProvider** (`/providers/UIProvider.tsx`)
   - Context principal que gestiona todo el estado de UI
   - Provee métodos para modales, toasts y configuración

2. **SystemModal** (`/components/SystemModal.tsx`)
   - Componente modal unificado que responde al estado del UIProvider
   - Soporta tipos: success, error, info
   - Auto-cierre configurable

3. **SiteBrand** (`/components/SiteBrand.tsx`)
   - Componente para mostrar nombre y logo del sitio
   - 3 variantes: full, compact, logo-only
   - Obtiene datos de SystemSetting desde la base de datos

4. **useUI** (`/hooks/useUI.ts`)
   - Hook simplificado con helpers comunes
   - Métodos predefinidos para operaciones frecuentes

## Instalación y Configuración

### 1. Envolver la App con UIProvider

```tsx
// App.tsx
import { UIProvider } from "@/providers/UIProvider";
import { SystemModal } from "@/components/SystemModal";
import { Toaster } from "sonner";

function App() {
  return (
    <UIProvider>
      <div className="min-h-screen bg-background text-foreground">
        {/* Tus rutas y componentes */}
        <Routes>
          {/* ... */}
        </Routes>
        
        {/* Componentes globales de UI */}
        <SystemModal />
        <Toaster 
          position="top-right"
          expand={true}
          richColors
          closeButton
        />
      </div>
    </UIProvider>
  );
}
```

### 2. Actualizar Schema de Base de Datos

```prisma
model SystemSetting {
  id            String   @id @default("system")
  maxOccupancy  Int      @default(100)
  siteName      String?  @default("Zona Xtreme")
  logoUrl       String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

## Uso Básico

### Usando el Hook Directo

```tsx
import { useUi } from '@/providers/UIProvider';

function MiComponente() {
  const {showModal, showSuccess} = useUi();

  const handleSuccess = () => {
    showModal({
      type: 'success',
      title: 'Éxito',
      message: 'Operación completada',
      autoClose: true
    });
  };

  const handleToast = () => {
    showSuccess('Mensaje de éxito');
  };

  return (
    <div>
      <button onClick={handleSuccess}>Mostrar Modal</button>
      <button onClick={handleToast}>Mostrar Toast</button>
    </div>
  );
}
```

### Usando el Hook Simplificado

```tsx
import { useUI } from '@/hooks/useUI';

function MiComponente() {
  const {modal, toast, operations} = useUI();

  const handleSuccess = () => {
    modal.success('Éxito', 'Operación completada');
  };

  const handleToast = () => {
    toast.success('Mensaje de éxito');
  };

  const handleSave = () => {
    // Helper para operaciones de guardado
    operations.saved('Usuario');
  };

  return (
    <div>
      <button onClick={handleSuccess}>Modal Éxito</button>
      <button onClick={handleToast}>Toast Éxito</button>
      <button onClick={handleSave}>Guardar Usuario</button>
    </div>
  );
}
```

## API Reference

### UIProvider Methods

#### Modales
- `showModal(config)` - Muestra modal con configuración completa
- `hideModal()` - Cierra modal actual

#### Toasts (wrappers de Sonner)
- `showSuccess(message, options)`
- `showError(message, options)`
- `showInfo(message, options)`
- `showWarning(message, options)`

#### Configuración
- `updateSystemSettings(settings)` - Actualiza configuración del sistema
- `refreshSettings()` - Recarga configuración desde API

#### Estado Global
- `setLoading(loading)` - Controla loading global
- `toggleTheme()` - Cambia tema

### useUI Hook Methods

#### Modales Simplificados
- `modal.success(title, message?, options?)`
- `modal.error(title, message?, options?)`
- `modal.info(title, message?, options?)`
- `modal.confirm(title, message?, onConfirm?, onCancel?)`

#### Toasts
- `toast.success(message)`
- `toast.error(message)`
- `toast.info(message)`
- `toast.warning(message)`

#### Operaciones del Sistema
- `operations.saved(entity)` - Mensaje de guardado exitoso
- `operations.saveError(entity, error?)` - Error al guardar
- `operations.success(operation)` - Operación exitosa
- `operations.error(operation, error?)` - Error en operación
- `operations.confirmDelete(entity, onConfirm)` - Confirmar eliminación

### useSystemSettings Hook

```tsx
import { useSystemSettings } from '@/hooks/useUI';

function SettingsComponent() {
  const { 
    settings, 
    isLoading, 
    refresh, 
    updateSiteName, 
    updateLogoUrl, 
    updateMaxOccupancy 
  } = useSystemSettings();

  const handleUpdateName = (newName: string) => {
    updateSiteName(newName);
  };

  return (
    <div>
      {isLoading ? (
        <p>Cargando...</p>
      ) : (
        <div>
          <p>Site: {settings?.siteName}</p>
          <input 
            onChange={(e) => handleUpdateName(e.target.value)}
            value={settings?.siteName || ''}
          />
        </div>
      )}
    </div>
  );
}
```

## SiteBrand Component

```tsx
import { SiteBrand } from '@/components/SiteBrand';

// Variantes disponibles
<SiteBrand variant="full" />        // Logo + nombre + subtítulo
<SiteBrand variant="compact" />     // Logo + nombre
<SiteBrand variant="logo-only" />   // Solo logo

// Con clase personalizada
<SiteBrand variant="compact" className="mb-4" />
```

## Ejemplos Prácticos

### 1. Formulario con Validación

```tsx
function UserForm() {
  const { operations, setLoading } = useUI();
  const [formData, setFormData] = useState({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await saveUser(formData);
      operations.saved('Usuario');
      modal.success('Usuario Guardado', 'Los datos se guardaron correctamente', {
        autoClose: true
      });
    } catch (error) {
      operations.saveError('Usuario', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Campos del formulario */}
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Guardando...' : 'Guardar'}
      </button>
    </form>
  );
}
```

### 2. Eliminación con Confirmación

```tsx
function UserList() {
  const { operations, modal } = useUI();

  const handleDelete = (userId: string) => {
    operations.confirmDelete('Usuario', async () => {
      try {
        await deleteUser(userId);
        ui.toast.success('Usuario eliminado');
        // Recargar lista...
      } catch (error) {
        ui.toast.error('Error al eliminar usuario');
      }
    });
  };

  return (
    <div>
      {users.map(user => (
        <div key={user.id}>
          <span>{user.name}</span>
          <button onClick={() => handleDelete(user.id)}>
            Eliminar
          </button>
        </div>
      ))}
    </div>
  );
}
```

### 3. Configuración del Sistema

```tsx
function SystemSettings() {
  const { updateSystemSettings, toast } = useUI();

  const handleUpdateSettings = async (newSettings: SystemSetting) => {
    try {
      updateSystemSettings(newSettings);
      toast.success('Configuración actualizada');
    } catch (error) {
      toast.error('Error al actualizar configuración');
    }
  };

  return (
    <div>
      <div className="mb-4">
        <SiteBrand variant="compact" />
      </div>
      
      <div>
        <label>Nombre del Sitio</label>
        <input
          value={systemSettings?.siteName || ''}
          onChange={(e) => updateSystemSettings({
            ...systemSettings!,
            siteName: e.target.value,
            updatedAt: new Date(),
          })}
        />
      </div>
    </div>
  );
}
```

## Best Practices

### 1. Usar helpers de operaciones
```tsx
// ✅ Bueno
operations.saved('Producto');

// ❌ Evitar
showSuccess('Producto guardado correctamente');
```

### 2. Manejo de loading states
```tsx
// ✅ Bueno
setLoading(true);
try {
  await operation();
  operations.success('Operación');
} catch (error) {
  operations.error('Operación', error.message);
} finally {
  ui.setLoading(false);
}
```

### 3. Modales para confirmaciones
```tsx
// ✅ Bueno
operations.confirmDelete('Elemento', onConfirm);

// ❌ Evitar confirmaciones con window.confirm
if (window.confirm('¿Eliminar?')) { ... }
```

### 4. Acceso a configuración
```tsx
// ✅ Bueno - usar hook específico
const { settings, updateSiteName } = useSystemSettings();

// ❌ Evitar acceso directo
const ui = useUi();
systemSettings?.siteName;
```

## Integración con Backend

Para completar la integración, necesitarás:

1. **API Endpoints** para SystemSetting:
   - `GET /api/system/settings` - Obtener configuración
   - `PUT /api/system/settings` - Actualizar configuración

2. **Socket Events** para actualizaciones en tiempo real:
   - `system:settings:updated` - Cuando otro usuario cambia la configuración

3. **Cache Invalidation** siguiendo las reglas del proyecto:
   - Solo el backend puede invalidar queries
   - Usar Socket.io para sincronización

Este sistema proporciona una base sólida y consistente para toda la UI de la aplicación Zona Xtreme.
