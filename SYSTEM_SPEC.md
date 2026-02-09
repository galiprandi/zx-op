# SYSTEM SPECIFICATIONS: ZONA XTREME AIRLINES

## 1. Project Overview

A local-first management system for a massive inflatable attraction. The system tracks time-based access via QR/Barcode wristbands, managing occupancy and real-time status across multiple stations in a local Mesh network environment.

---

## 2. Technical Stack

* **Server:** Node.js (Fastify) hosted on a local central PC.
* **Database:** SQLite3 for persistent local storage using Prisma ORM.
* **Communication:** WebSockets (Socket.io) for real-time state synchronization.
* **Frontend:** React.js (Vite) Progressive Web App (PWA).
* **Networking:** TP-Link Deco X20 Mesh (Local-only, no internet).

---

## 3. Data Model (Schema)

### `customers`

* `id`: String (Primary Key, QR/Barcode UID)

---

## 4. Operational Flow & Business Logic

### A. Check-in (Caja)

* Staff scans a new wristband and selects a time package (e.g., 30m, 60m).
* The system initializes the `Wristband` record in `Idle` status.

### B. Boarding Gate (Entrance)

1. Staff scans wristband.
2. **Validation:**
* If `remaining_minutes > 0`: Status changes to `In-Flight`. `last_boarding_time` and `expiration_time` are set.
* If `remaining_minutes <= 0`: Access Denied (Visual/Audio Alert).


3. **Occupancy:** Increment `current_occupancy` counter.

### C. Technical Stop (Temporary Exit)

1. Staff scans wristband at exit.
2. Status changes to `Technical-Stop`.
3. **Crucial:** `current_occupancy` decreases immediately to allow new entries.
4. **Timer Policy:** Credit consumption continues while in "Technical Stop" (Wall-clock time).

### D. Auto-Release & Landing

* **Landing:** When `expiration_time` is reached, the UI alerts the internal staff.
* **Auto-Release:** If a wristband is `In-Flight` and reaches `expiration_time + 5 minutes`, the system automatically changes status to `Landed` and decrements `current_occupancy` if the child hasn't been scanned out.

---

## 5. View Requirements

### V1: Check-in Terminal (Staff Caja)

* Large numeric keypad for manual ID entry + Barcode listener.
* Quick-action buttons for time presets.
* Wristband status lookup.

### V2: Boarding & Flight Control (Staff Internal/Gate)

* **Scan Mode:** Fullscreen camera/scanner listener with Green (Success) / Red (Denial) feedback.
* **Active List:** Table of `In-Flight` IDs sorted by `expiration_time` (ascending).
* **Alerts:** Flash red when a child's time is up.

### V3: Public Flight Board (Smart TV)

* Split screen showing IDs "In the Air" (Active) vs "Preparing for Landing" (Expired).
* Progress bars for each ID.
* Color logic:
* **Green:** > 5 minutes remaining.
* **Yellow:** < 5 minutes remaining.
* **Red:** Time expired (Go to Check-in).

---

## 6. Resilience & Offline Features

* **Static IP:** The server must have a static IP (e.g., `192.168.68.100`) in the Deco X20 settings.
* **State Recovery:** On server crash/restart, Node.js must recalculate `remaining_minutes` for all `In-Flight` wristbands based on the current system time vs `expiration_time`.
* **Bailout Mode:** Export a CSV of active wristbands every 10 minutes to a "Backup" folder for manual lookup if the system fails.