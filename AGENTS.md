# AGENTS.md - "Zona Xtreme" Operation System

## 1. Project Context

This system manages the flow of passengers in a massive inflatable attraction (**Zona Xtreme**) using a flight operation analogy. The infrastructure is a **local-only Mesh network (TP-Link Deco X20)** with no internet access.

## 2. Technical Guidelines & Language Standards

* **Code & Documentation:** All source code, variable names, database schemas, and technical documentation must be in **English**.
* **Comments:** All comments within the codebase must be in **English**.
* **User Interface (UI):** The staff and public-facing interfaces should be in **Spanish** (unless otherwise specified). Follow the [UI Design Guide](./ui/DESIGN-GUIDE.md) for the dark, mobile-first styling system.
* **Developer Communication:** Communication with the Project Owner will be conducted in **Spanish**.

## 3. Domain Definitions (Aviation Analogy)

* **Check-in:** Initial registration and credit loading (Time/Laps) onto the QR/Barcode wristband.
* **Boarding Gate (Pre-Flight):** Transition area for shoe removal and mandatory sock placement.
* **Airborne (Active Zone):** The inflatable area where the occupancy quota is active and time is consumed.
* **Technical Stop (Pause):** Temporary exit (hydration/parents). This state **releases the physical occupancy slot** immediately but keeps the "flight" (ticket) active.
* **Arrivals (Landing):** Final exit where the child collects shoes and leaves the system.

## 4. Business Logic Instructions

* **Strict Validation:** No passenger enters "Airborne" status without validated credit at the boarding gate scan.
* **Dynamic Quota Management:** * **Escala/Pause:** When a "Technical Stop" scan occurs, the occupancy count must decrease immediately to allow new entries.
* **Auto-Release:** If no manual exit is recorded, the system must automatically release the occupancy slot **5 minutes ()** after the credit expires.


* **Wristband Persistence:** Exits are treated as "Technical Stops" by default. Credit is consumed by elapsed time, regardless of whether the child is inside or outside the zone.

## 5. Technical Stack & Requirements

* **Architecture:** Local Web Solution (PWA recommended for mobile devices).
* **Stack:** Node.js (Express), React (Tailwind CSS), SQLite.
* **Real-Time Sync:** Use WebSockets (Socket.io) to ensure the Parents' Monitor and Staff Dashboard are synchronized without manual refreshes.
* **Resilience:** The system must handle automatic reconnections if mobile devices lose signal within the Mesh network.
* **Local Persistence:** SQLite is the single source of truth. The system must recover all active "Flight" states upon server restart.

## 6. Required Views

1. **Check-in Terminal (Mobile/Tablet):** Fast credit loading and wristband scanning.
2. **Boarding/In-Flight Dashboard (Staff Mobile):** Binary interface (Green/Red) and "Landing List" (IDs to be removed from the inflatable).
3. **Public Monitor (Smart TV):** Visual display of IDs and countdown timers using color coding (Green > Yellow > Red).
