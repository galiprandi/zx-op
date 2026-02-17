# Operation View Specification

## 1. Overview

This document defines the `OperationView` behavior for Zona Xtreme staff, including wristband scan, session state visibility, play/pause control, and purchased-products context.

## 2. Core Purpose

- Provide a fast mobile interface to control a player session (`PLAY` / `PAUSE`) by scanning a wristband.
- Show live remaining time and session status.
- Show purchased products summary for the scanned wristband (time products and accessories).
- Keep the primary CTA always visible at the bottom of the viewport.

## 3. Routing and Entry

- Route: `/operation`
- View component: `ui/src/views/OperationView.tsx`
- Shell: `MobileShell`

## 4. Data Sources

### 4.1 Session status

- Hook: `usePlayerSession(barcodeId)`
- Endpoint chain (via UI API):
  - `GET /api/sessions/status/:barcodeId`
  - `POST /api/sessions/play`
  - `POST /api/sessions/pause`

### 4.2 Purchased products summary

- Query: React Query with key `['checkinHistory', barcodeId]`
- API call: `getCheckinHistory(barcodeId, 100)`
- Endpoint: `GET /api/checkin/history/:barcodeId?limit=100`

### 4.3 Real-time sync

- Hook: `useSocket()`
- Relevant event behavior already implemented in socket layer:
  - `transaction:created` invalidates `['checkinHistory']`
  - session events update/invalidate session-related queries

## 5. UI Structure

### 5.1 Header and scanner area

- Top shell header with brand and online indicator.
- QR/manual scanner input (`QRScanner`) for wristband code.

### 5.2 Main content

Based on scan + session query state:

- No scanned barcode:
  - Intro illustration/text.
- Loading session:
  - Spinner + "Cargando sesión...".
- Session fetch error:
  - Error card.
- Session found:
  - Big timer + status badge.
- Session not found:
  - "No existe sesión activa" card.

### 5.3 Sticky footer

The footer is always pinned to the bottom when `barcodeId && session` is true, and contains:

1. Purchased summary card:
- Loading state: "Cargando productos..."
- Error state: non-blocking message.
- Empty state: "Sin productos registrados aún."
- Data state:
  - "Tiempo comprado total": from `session.totalAllowedSeconds` formatted with `formatTimeValue`.
  - "TIEMPO": grouped time products with quantity (`xN`).
  - "ACCESORIOS": grouped non-time products with quantity (`xN`).

2. Primary CTA (`ActionButton`):
- Dynamic mode:
  - `PLAY` when session is paused/waiting and can start.
  - `PAUSAR` when session is active and can be paused.
  - `Tiempo Agotado` disabled when remaining time is `<= 0`.
  - `Cargando...` disabled while session is loading.
- Tap opens `ConfirmSheet` before executing mutation.

## 6. Time Formatting Rules

### 6.1 Big timer (`BigTimer`)

- `seconds <= 0` -> `00:00`
- `seconds < 3600` -> `MM:SS` (example: `58:12`)
- `seconds >= 3600` -> `formatTimeValue(seconds)` (example: `8h 38m`)

This avoids ambiguous displays like `518:00` for long durations.

### 6.2 Purchased total time

- Source: `session.totalAllowedSeconds`
- Format: `formatTimeValue`

## 7. Grouping Logic for Purchased Products

- Transactions are grouped by `productId`.
- Quantity is accumulated per product.
- Product category for summary rendering:
  - Time product: `product.timeValueSeconds != null`
  - Accessory: `product.timeValueSeconds == null`

## 8. Error Handling and Resilience

- Session errors and history errors are isolated.
- History failure never blocks play/pause operation.
- Footer summary degrades gracefully to text states.
- Socket reconnection behavior is handled by `useSocket` configuration.

## 9. Mobile Layout Requirements

- Main content remains scrollable.
- Footer remains sticky at bottom.
- Footer bottom spacing includes iOS safe-area support:
  - `pb-[calc(env(safe-area-inset-bottom)+0.75rem)]`

## 10. Acceptance Criteria

1. Scanning a valid wristband shows session timer/status and footer block.
2. CTA is always visible at the bottom while a session is loaded.
3. Purchased summary shows grouped time products and accessories.
4. "Tiempo comprado total" matches `session.totalAllowedSeconds` formatting.
5. Long timers display in `h m` format (not long raw minute values).
6. New check-in transactions update summary via socket-driven invalidation.
7. If history fails, operation control still works.
