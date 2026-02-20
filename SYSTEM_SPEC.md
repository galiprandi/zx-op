# SYSTEM SPECIFICATIONS: ZONA XTREME AIRLINES

## 1. Project Overview

A local-first management system for a massive inflatable attraction. The system tracks time-based access via QR/Barcode wristbands, managing occupancy and real-time status across multiple stations in a local Mesh network environment.

---

## 2. Technical Stack

* **Server:** Node.js (Fastify) hosted on a local central PC.
* **Database:** PostgreSQL for persistent local storage using Prisma ORM.
* **Communication:** WebSockets (Socket.io) for real-time state synchronization.
* **Frontend:** React.js (Vite) Progressive Web App (PWA).
* **Networking:** TP-Link Deco X20 Mesh (Local-only, no internet).

---

## 3. Data Model (Schema)

### `player_sessions`

* `id`: String (Primary Key, cuid)
* `barcode_id`: String (Unique QR/Barcode UID)
* `total_allowed_seconds`: Int (Total purchased seconds)
* `accumulated_seconds`: Int (Consumed seconds from finished segments)
* `last_start_at`: DateTime? (When Play was last pressed)
* `is_active`: Boolean (Playing vs paused)
* `expires_at`: DateTime? (Legacy compatibility field; not used for consumption calculation)
* `laps_count`: Int (Manual lap counter recorded during active play)
* `created_at`: DateTime
* `updated_at`: DateTime

### `products`

* `time_value_seconds`: Int? (If present, adds time to `player_sessions`)
* Other product fields: name, description, price, category, required, is_deleted

### `transactions`

* Linked to `player_sessions` and `products` (records consumptions and time purchases)

---

## 4. Operational Flow & Business Logic

### A. Check-in (Caja)

* Staff scans a wristband (barcode) and selects products (tiempo + adicionales).
* The system creates or finds the `player_session` and adds purchased time (`total_allowed_seconds += time_value_seconds`), keeping existing balance.
* Session stays **paused/inactive** until Play at the gate.
* **Timer policy:** check-in only loads credit. Time does not start consuming at check-in.

### B. Boarding Gate (Entrance)

1. Staff scans wristband (barcode) → triggers **Play**.
2. **Validation:**
* If `remaining_seconds > 0`: Status changes to **In-Flight** (`is_active=true`, `last_start_at=now()`).
* If `remaining_seconds <= 0`: Access Denied (Visual/Audio Alert).

3. **Occupancy:** Increment `current_occupancy` counter.

### C. Technical Stop (Temporary Exit)

1. Staff scans wristband at exit → triggers **Pause**.
2. Status changes to `Technical-Stop` (paused), `is_active=false`, `last_start_at` cleared, `accumulated_seconds` updated.
3. **Crucial:** `current_occupancy` decreases immediately to allow new entries.
4. **Timer Policy:** Credit consumption runs only while `is_active=true`. On pause, segment consumption is accumulated and timer stops immediately.

### C.1 Lap Registration (Operation View)

1. When a wristband is in active play (`is_active=true` and `remaining_seconds > 0`), staff can tap **Registrar vuelta**.
2. Each tap increments `laps_count` by exactly 1.
3. Lap data is attached to the same session and used for per-session operational stats (e.g., average seconds per lap).
4. Lap registration is disabled for paused, waiting, or expired sessions.
5. Visibility:
* **Monitor** shows "Tiempo promedio por vuelta" for the current operational day using weighted formula:
  `sum(consumed_seconds_live) / sum(laps_count)` over sessions with `laps_count > 0`.
  For active sessions, `consumed_seconds_live = accumulated_seconds + (now - last_start_at)`.
* **Reports** shows per-day "Prom. / vuelta" only for closed operational days, with `N/A` when there are no laps.

### D. Auto-Release & Landing

* **Landing:** When `remaining_seconds` reaches 0, the UI alerts the internal staff.
* **Auto-Release:** If a wristband is `In-Flight` and reaches `0 + 5 minutes`, the system automatically triggers **Pause** (mark inactive) and decrements `current_occupancy` if the child hasn't been scanned out.

---

## 5. View Requirements

### V1: Check-in Terminal (Staff Caja)

* Large numeric keypad for manual ID entry + Barcode listener.
* Quick-action buttons for time presets (productos de tiempo).
* Session status lookup (remaining time, active/paused).
* Adds products (tiempo y extras) to the same `player_session` accumulating balance.

### V2: Boarding & Flight Control (Staff Internal/Gate)

* **Scan Mode:** Fullscreen camera/scanner listener with Green (Success) / Red (Denial) feedback.
* **Play/Pause Control:** Single button that adapts to state (Play if paused, Pause if active) with confirmation modal to avoid accidental toggles.
* **Active List:** Table of `In-Flight` IDs sorted by remaining time (ascending).
* **Alerts:** Flash red when a child's time is up.

### V3: Public Flight Board (Smart TV)

* Split screen showing IDs "In the Air" (Active) vs "Preparing for Landing" (Low/Paused).
* Progress bars for each ID with remaining time.
* Color logic:
* **Green:** > 5 minutes remaining.
* **Yellow:** < 5 minutes remaining.
* **Red:** Time expired (Go to Check-in).

### V4: Products Admin (Staff)

* CRUD de productos (tiempo y extras).
* Campo `time_value_seconds` para productos de tiempo.
* Control de requeridos/opcionales.
* Categorías administrables desde UI (listar, crear, renombrar y eliminar), servidas por API.

---

## 6. Resilience & Offline Features

* **Static IP:** The server must have a static IP (e.g., `192.168.68.100`) in the Deco X20 settings.
* **State Recovery:** On server crash/restart, Node.js must recalculate `remaining_minutes` for all `In-Flight` wristbands based on the current system time vs `expiration_time`.
* **Bailout Mode:** Export a CSV of active wristbands every 10 minutes to a "Backup" folder for manual lookup if the system fails.
