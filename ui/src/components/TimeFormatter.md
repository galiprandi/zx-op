# TimeFormatter Component

Un componente reusable para manejar el formateo y estados de tiempo en toda la aplicación Zona Xtreme.

## Características

- **Estados de tiempo**: `stop`, `asc` (ascendente), `desc` (descendente)
- **Sin diseño ni tipografía**: Solo lógica de formateo y temporización
- **Render props**: Flexibilidad total para personalizar la visualización
- **Auto-limpieza**: Maneja automáticamente intervals y cleanup

## Uso Básico

```tsx
import { TimeFormatter } from "@/components/TimeFormatter";

// Countdown (descendente)
<TimeFormatter seconds={120} state="desc">
  {({ formatted, raw, minutes, seconds, isExpired }) => (
    <div>{formatted}</div>
  )}
</TimeFormatter>

// Static (detenido)
<TimeFormatter seconds={300} state="stop">
  {({ formatted }) => <div>{formatted}</div>}
</TimeFormatter>

// Count up (ascendente)
<TimeFormatter seconds={0} state="asc">
  {({ formatted }) => <div>{formatted}</div>}
</TimeFormatter>
```

## Estados

- **`stop`**: Muestra el tiempo estático sin cambios
- **`desc`**: Cuenta regresiva cada segundo (hasta 0)
- **`asc`**: Cuenta progresiva cada segundo (desde 0)

## Render Props

El componente pasa las siguientes propiedades al children function:

- `formatted`: String formateado "MM:SS"
- `raw`: Número total de segundos
- `minutes`: Minutos calculados
- `seconds`: Segundos calculados  
- `isExpired`: Boolean si el tiempo llegó a 0

## Callback

```tsx
<TimeFormatter 
  seconds={session.remainingSeconds} 
  state="desc"
  onTimeUpdate={(newSeconds) => {
    // Opcional: manejar actualizaciones de tiempo
    console.log('Time updated:', newSeconds);
  }}
>
  {({ formatted }) => <div>{formatted}</div>}
</TimeFormatter>
```

## Ejemplo en OperationView

```tsx
<TimeFormatter 
  seconds={session.remainingSeconds} 
  state={getTimerState()}
>
  {({ raw }) => (
    <BigTimer 
      seconds={raw} 
      size="md"
      showMinutes={false}
    />
  )}
</TimeFormatter>
```

## Beneficios

1. **Centraliza la lógica**: Todo el manejo de tiempo en un solo lugar
2. **Consistente**: Mismo comportamiento en toda la app
3. **Flexible**: Render props permiten cualquier diseño
4. **Performance**: Manejo eficiente de intervals y cleanup
5. **TypeScript**: Full type safety
