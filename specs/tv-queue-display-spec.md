# TV Queue Display Specification

## Overview

Crear una vista independiente para TV vertical de 50" que funcione como sistema de turnos mostrando logo configurable y cola de espera unificada de próximos 15 participantes.

## Business Context

Esta vista resolverá el problema de formación de colas físicas en Zona Xtreme, mostrando de manera clara y visible el orden de turno para que padres y niños puedan ver quién sigue sin necesidad de hacer fila. La pantalla se ubicará estratégicamente cerca de la zona de juego para máxima visibilidad.

## Technical Requirements

### 1. Database Schema Changes

#### SystemSetting Model Extension
```prisma
model SystemSetting {
  id            String   @id @default("system")
  maxOccupancy  Int      @default(100)
  logoUrl       String?  // Nuevo campo para logo configurable
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

#### Migration Requirements
- Agregar campo `logoUrl` (String, nullable) a tabla `system_settings`
- Valor por defecto: null (logo opcional)
- Soporte para URLs externas o base64

### 2. New Route: `/tv-queue`

#### Component Structure
- **Archivo**: `ui/src/views/QueueDisplayView.tsx`
- **Layout**: Exclusivamente vertical 9:16
- **Viewport**: Optimizado para 1080x1920 (TV 50" vertical)
- **Responsive**: Sin adaptación horizontal, solo vertical

#### Technical Stack
- React + TypeScript
- Tailwind CSS con viewport units
- Socket.io para real-time updates
- Query invalidation following backend-driven pattern

### 3. Queue Logic Implementation

#### Data Sources
- `waitingSessions`: Sesiones con check-in pero sin juego previo
- `pausedSessions`: Sesiones en pausa que pueden reanudar
- **Excluidos**: `activePlayingSessions` (sesiones en juego)

#### Ordering Algorithm
```typescript
const unifiedQueue = [
  ...waitingSessions.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
  ...pausedSessions.sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt))
].slice(0, 15);
```

#### State Management
- **Query Key**: `["queueDisplay"]`
- **Socket Events**: `session:created`, `session:updated`, `session:play`, `session:pause`
- **Update Pattern**: Backend emits → Frontend invalidates → UI updates

## UI Design Specifications

### Layout Structure (9:16 ratio)
```
┌─────────────────┐ (20% height)
│   LOGO AREA     │ ← Configurable via settings
│                 │   400x200px max
├─────────────────┤ (10% height)
│   HEADER        │ ← "PRÓXIMOS EN ENTRAR"
│   TÍTULO        │   Texto grande, centrado
├─────────────────┤ (65% height)
│                 │
│   QUEUE LIST    │ ← 15 participantes máximo
│   (SCROLLABLE)  │   Scroll si hay más de 15
│                 │   Animación entrada derecha
├─────────────────┤ (5% height)
│   FOOTER        │ ← Status indicator
│   STATUS        │   "En línea" / "Desconectado"
└─────────────────┘
```

### Typography & Visibility System

#### Scale for 8m Distance
- **Main Title**: `clamp(2.5rem, 5vw, 4rem)` - 64px max
- **Queue Numbers**: `clamp(2rem, 4vw, 3rem)` - 48px max  
- **Participant IDs**: `clamp(1.8rem, 3.5vw, 2.5rem)` - 40px max
- **Status Text**: `clamp(1rem, 2vw, 1.5rem)` - 24px max

#### Color System (High Contrast)
```css
:root {
  --tv-background: 220 18% 6%;     /* Dark background */
  --tv-foreground: 210 40% 96%;    /* White text */
  --tv-primary: 210 100% 67%;      /* Blue accent */
  --tv-accent: 265 80% 70%;        /* Purple highlight */
  --tv-success: 142 76% 36%;       /* Green */
  --tv-warning: 45 100% 50%;       /* Orange */
  --tv-destructive: 0 72% 55%;     /* Red */
}
```

#### Contrast Requirements
- **Minimum Ratio**: 7:1 for normal text
- **Large Text**: 4.5:1 minimum
- **Interactive Elements**: 3:1 minimum

### Queue Item Design

#### Individual Item Structure
```css
.queue-item {
  height: clamp(60px, 8vh, 80px);
  padding: clamp(12px, 2vh, 20px);
  display: grid;
  grid-template-columns: auto 1fr;
  gap: clamp(16px, 3vw, 24px);
  align-items: center;
}
```

#### Visual Elements
```
┌─────────────────────────────────────┐
│  #01  ••••••••••••••••••••••••••  │
│        [ID PARTICIPANTE]           │
└─────────────────────────────────────┘
```

- **Position Number**: Left, large, `--tv-primary` color
- **Participant ID**: Center, monospace, `--tv-foreground`
- **Separator**: Subtle line between items
- **First Item**: Border `--tv-accent` + subtle glow effect

### Animation System

#### Entry Animation
```css
@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.queue-item {
  animation: slideInRight 400ms ease-out;
  animation-delay: calc(var(--item-index) * 100ms);
}
```

#### Update Animation
```css
@keyframes flashUpdate {
  0%, 100% { background-color: transparent; }
  50% { background-color: hsl(var(--tv-accent) / 0.2); }
}

.queue-item.updating {
  animation: flashUpdate 600ms ease-in-out;
}
```

#### Performance Constraints
- **Duration**: ≤ 400ms per animation
- **Easing**: `ease-out` for entries, `ease-in-out` for updates
- **Transforms**: Only `translateX` and `opacity` (GPU accelerated)
- **No Layout Thrash**: Avoid width/height animations

## Configuration Integration

### Settings Page Conversion

#### Current State (MonitorView Modal)
```typescript
// Existing modal in MonitorView.tsx
const [isConfigOpen, setIsConfigOpen] = useState(false);
// Modal with maxOccupancy configuration
```

#### Target State (Dedicated Settings Page)
```typescript
// New SettingsView.tsx
export function SettingsView() {
  // System settings (existing maxOccupancy)
  // Display settings (new logo configuration)
  // TV queue settings (enable/disable)
}
```

### Logo Management System

#### Upload Interface
```typescript
interface LogoConfig {
  file: File | null;
  preview: string;
  isUploading: boolean;
  error: string | null;
}
```

#### Supported Formats
- **Image Types**: JPEG, PNG, SVG, WebP
- **Max Size**: 2MB
- **Dimensions**: Recommended 400x200px, max 800x400px
- **Aspect Ratio**: 2:1 preferred

#### Storage Options
1. **Base64 Embed**: Direct in database (≤ 1MB)
2. **Local File**: Server storage + URL reference
3. **External URL**: Cloud storage reference

### Settings Page Layout
```
/settings
├── System Configuration
│   ├── Max Occupancy (existing)
│   └── Operation Hours (future)
├── Display Configuration  
│   ├── Logo Upload
│   │   ├── File Input
│   │   ├── Preview Panel
│   │   └── Remove/Reset Options
│   └── TV Queue Settings
│       ├── Enable Display
│       └── Test Mode
└── Advanced Settings
    └── [Future configurations]
```

## Real-time Integration

### Socket Event Handling

#### Events to Listen
```typescript
// Queue update events
socket.on("session:created", handleQueueUpdate);
socket.on("session:updated", handleQueueUpdate);
socket.on("session:play", handleQueueUpdate);
socket.on("session:pause", handleQueueUpdate);

// Settings events  
socket.on("settings:updated", handleSettingsUpdate);
```

#### Query Invalidation Pattern
```typescript
const handleQueueUpdate = () => {
  queryClient.invalidateQueries({ queryKey: ["queueDisplay"] });
};

const handleSettingsUpdate = () => {
  queryClient.invalidateQueries({ queryKey: ["systemSettings"] });
};
```

### Data Flow
```
Backend Action → Socket Emit → Frontend Receive → Query Invalidate → UI Update
```

## API Requirements

### System Settings Endpoints

#### GET /api/settings
```typescript
interface SystemSettings {
  maxOccupancy: number;
  logoUrl?: string;
  createdAt: string;
  updatedAt: string;
}
```

#### PUT /api/settings/logo
```typescript
interface LogoUpdateRequest {
  logoUrl?: string;
  // OR
  logoFile?: File; // Multipart form data
}

interface LogoUpdateResponse {
  success: boolean;
  logoUrl?: string;
  error?: string;
}
```

#### DELETE /api/settings/logo
```typescript
interface LogoDeleteResponse {
  success: boolean;
  message: string;
}
```

### Queue Data Endpoint

#### GET /api/queue/display
```typescript
interface QueueDisplayResponse {
  queue: QueueItem[];
  totalInQueue: number;
  lastUpdated: string;
}

interface QueueItem {
  position: number;
  barcodeId: string;
  state: 'waiting' | 'paused';
  enteredAt: string;
}
```

## Browser Compatibility

### Samsung TV Browser Support

#### Supported Features
- **CSS Grid**: Full support
- **Flexbox**: Full support  
- **CSS Custom Properties**: Full support
- **WebSockets**: Native support
- **ES6+**: Full support

#### Polyfills Required
- None expected for modern Samsung TVs (2020+)

#### Performance Considerations
- **GPU Acceleration**: Use `transform3d()` for hardware acceleration
- **Memory**: Keep state minimal (< 1MB)
- **Network**: Optimize for WiFi, handle reconnections

### Fallback Strategies
```css
/* Fallback for older browsers */
.queue-item {
  display: flex; /* Fallback */
  display: grid; /* Modern */
  grid-template-columns: auto 1fr;
}
```

## Error Handling & Edge Cases

### Connection Issues
```typescript
// Offline state
const [isOnline, setIsOnline] = useState(navigator.onLine);

// Auto-retry logic
useEffect(() => {
  if (!isOnline) {
    const retry = setTimeout(() => {
      window.location.reload();
    }, 5000);
    return () => clearTimeout(retry);
  }
}, [isOnline]);
```

### Data Validation
```typescript
const validateQueueItem = (item: any): item is QueueItem => {
  return (
    typeof item.barcodeId === 'string' &&
    typeof item.position === 'number' &&
    ['waiting', 'paused'].includes(item.state)
  );
};
```

### Fallback States
- **No Logo**: Show "ZONA XTREME" text
- **Empty Queue**: "Sin turnos pendientes"
- **Connection Lost**: "Reconectando..." with retry indicator
- **Invalid Data**: Skip malformed items, log error

## Testing Strategy

### Unit Tests
- Queue ordering algorithm
- Socket event handlers
- Settings validation
- Error boundaries

### Integration Tests  
- End-to-end queue updates
- Settings persistence
- Socket reconnection
- File upload flow

### TV-Specific Testing
- **Viewport Testing**: 1080x1920 resolution
- **Distance Testing**: 8m legibility verification
- **Browser Testing**: Samsung TV browser simulation
- **Performance Testing**: 60fps animation validation

## Success Metrics

### Performance KPIs
- **First Paint**: < 1s
- **Queue Update**: < 100ms
- **Animation FPS**: 60fps stable
- **Memory Usage**: < 50MB

### Usability KPIs
- **Legibility**: 100% text readable at 8m
- **Setup Time**: < 2 minutes for logo configuration
- **Uptime**: 99.9% availability
- **User Satisfaction**: Qualitative feedback from staff

## Future Enhancements

### Phase 2 Features
- **Sound Effects**: Chime when queue changes
- **Multiple Displays**: Sync multiple TVs
- **Custom Themes**: Event-specific color schemes
- **Analytics Dashboard**: Queue wait time metrics

### Phase 3 Features
- **Mobile Integration**: QR code for personal queue status
- **Priority System**: VIP/express lane support
- **Multilingual Support**: English/Spanish toggle
- **Advanced Analytics**: Predictive wait times

## Security Considerations

### File Upload Security
- **File Type Validation**: MIME type + extension verification
- **Size Limits**: 2MB maximum
- **Content Scanning**: Basic malware detection
- **Storage Isolation**: Separate upload directory

### Data Privacy
- **No Personal Data**: Only show participant IDs
- **Minimal Exposure**: No names or personal information
- **Local Storage**: No external data transmission

## Deployment Checklist

### Pre-deployment
- [ ] Database migration applied
- [ ] API endpoints tested
- [ ] TV browser compatibility verified
- [ ] Performance benchmarks met

### Post-deployment
- [ ] Monitor TV display uptime
- [ ] Track queue update latency
- [ ] Collect staff feedback
- [ ] Monitor error rates

---

**Document Version**: 1.0  
**Last Updated**: 2026-02-14  
**Author**: Cascade AI Assistant  
**Review Status**: Pending Review
