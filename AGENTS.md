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
* **Stack:** Node.js (Express/Fastify), React (Tailwind CSS), **PostgreSQL**.
* **Real-Time Sync:** Use WebSockets (Socket.io) to ensure the Parents' Monitor and Staff Dashboard are synchronized without manual refreshes.
* **Resilience:** The system must handle automatic reconnections if mobile devices lose signal within the Mesh network.
* **Local Persistence:** PostgreSQL is the single source of truth. The system must recover all active "Flight" states upon server restart.

## 5.1. **CRITICAL: Query Invalidation Rule**

* **Backend-Driven Updates Only:** All query invalidations and cache updates must be driven **exclusively** by the backend through Socket.io events when data persists. 
* **No Frontend Manual Invalidation:** The frontend must **NEVER** manually invalidate queries or trigger cache updates. All real-time synchronization must happen through backend-emitted socket events.
* **Socket Event Flow:** Backend persists data → Backend emits socket events → Frontend socket listeners invalidate appropriate queries → UI updates automatically.

## 5.2. **CRITICAL: UI Formatting Standards**

* **Time Formatting:** Use the shared `TimeFormatter` component (`ui/src/components/TimeFormatter.tsx`) whenever time values are displayed in the UI. Avoid ad-hoc time formatting logic in views/components.
* **Currency Formatting:** Use the shared `formatCurrency` helper (`ui/src/lib/currency.ts`) for all monetary values in the UI. Avoid direct `Intl.NumberFormat` currency formatting in feature code.
* **Presentation Scope:** These formatters must provide formatting only (no visual styles), so typography/colors/layout remain controlled by the consuming component.

## 5.3. **CRITICAL: Reports Scope (Closed Days Only)**

* **No In-Progress Day in Reports:** The `/reports` section must never include the current in-progress operational day in any KPI, summary card, or table.
* **Monitor vs Reports Separation:** In-progress operational visibility belongs to **Monitor**; **Reports** is strictly historical and based on closed operational days.
* **Operational Windows:** All report aggregations must use windows derived from `timezone` + `operationalDayStart`, and only finalized (closed) windows.

## 6. Required Views

1. **Check-in Terminal (Mobile/Tablet):** Fast credit loading and barcode wristband scanning; add products (time and extras); accumulates time on existing player session.
2. **Boarding/In-Flight Dashboard (Staff Mobile):** Play/Pause control via barcode scan with confirmation modal; shows remaining time and landing list.
3. **Public Monitor (Smart TV):** Visual display of IDs and countdown timers using color coding (Green > Yellow > Red).
4. **Products Admin (Staff):** CRUD for products, including `time_value_seconds` for time packages and required/optional flags.

## 7. Mandatory Spec-First Workflow *(applies only if `/specs` directory exists)*

*This workflow activates only when the repository contains the `/specs` directory (including `/specs/SYSTEM_SPEC.md`).*

* **Spec Review Before Any Task:** Before starting any implementation, bugfix, refactor, or behavior change, the agent must locate and read the related spec(s) in `/specs` (and any relevant root docs such as `/specs/SYSTEM_SPEC.md`).
* **No Implicit Logic Changes:** If the requested work requires changing logic explicitly defined in an existing spec, the agent must follow this exact sequence:
  1. Ask for user authorization **before coding**, explaining:
     * what will change,
     * how the current behavior works,
     * how behavior will work after the change,
     * possible risks/issues/regressions.
  2. Update the related spec(s) to reflect the approved behavior.
  3. Implement the code change aligned with the updated spec(s).
* **Strict Order Enforcement:** For spec-governed logic changes, implementation must never happen before user authorization and spec update.

## 8. Active Documentation Maintenance

* The agent must actively review and maintain existing documentation as part of normal development work.
* When code and documentation diverge, the agent must propose and apply doc updates in the same task scope whenever possible.
* New behavior, constraints, and operational rules introduced in code must be reflected in the corresponding spec(s) and technical docs.

## 9. Fedora Server Deployment

### 9.1. Privileged Operations - Password Prompt

When root access is required, use `pkexec` to trigger a **native graphical password dialog**:

```bash
pkexec <command>
```

This displays a system authentication dialog. Use it for:
- Copying files to `/etc/systemd/system/`
- Modifying SELinux settings (`setenforce`, `/etc/selinux/config`)
- Updating `/etc/sudoers.d/`

Example workflow:
```bash
pkexec cp /home/zx/zx-op/zx-ui.service /etc/systemd/system/
pkexec setenforce 0
pkexec sed -i 's/^SELINUX=enforcing/SELINUX=permissive/' /etc/selinux/config
```

### 9.2. Service Architecture

| Service | Port | Protocol | Description |
|---------|------|----------|-------------|
| `zx-api.service` | 3000 | HTTP | Express API backend |
| `zx-ui.service` | 8080 | HTTPS | Vite PWA frontend |

Both services run as `zx` user and log to `/var/log/zx-api/` and `/var/log/zx-ui/`.

### 9.3. Systemd Configuration

**zx-ui.service** (`/etc/systemd/system/zx-ui.service`):
```ini
[Unit]
Description=Zona Xtreme UI Service
After=network.target
Wants=zx-api.service  # Soft dependency - UI starts even if API fails

[Service]
Type=simple
User=zx
WorkingDirectory=/home/zx/zx-op
EnvironmentFile=/home/zx/zx-op/.env
Environment="PATH=/home/zx/.nvm/versions/node/v24.13.1/bin:/home/zx/.local/share/pnpm:/usr/local/bin:/usr/bin:/bin"
Environment="PNPM_HOME=/home/zx/.local/share/pnpm"
ExecStartPre=/usr/bin/bash -c "source /home/zx/.nvm/nvm.sh && cd /home/zx/zx-op && pnpm --filter ui build"
ExecStart=/usr/bin/bash -c "source /home/zx/.nvm/nvm.sh && cd /home/zx/zx-op && pnpm --filter ui preview --host 0.0.0.0 --port 8080"
Restart=always
RestartSec=5
StandardOutput=append:/var/log/zx-ui/zx-ui.out.log
StandardError=append:/var/log/zx-ui/zx-ui.err.log

[Install]
WantedBy=multi-user.target
```

**Key settings for reliability:**
- `Wants=` instead of `Requires=`: UI starts independently if API fails
- `Restart=always`: Auto-recovery on crash
- `--host 0.0.0.0`: Binds to all interfaces (survives IP changes)
- `enabled`: Starts automatically at boot

### 9.4. SELinux Configuration

SELinux must be in **permissive mode** to allow systemd to access home directory files and scripts:

```bash
# Temporary (until reboot)
pkexec setenforce 0

# Permanent
pkexec sed -i 's/^SELINUX=enforcing/SELINUX=permissive/' /etc/selinux/config
```

Verify with: `getenforce` → should return `Permissive`

### 9.5. Sudo Configuration

Passwordless sudo for specific operations is configured in `/etc/sudoers.d/zx-op`:

```bash
zx ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart zx-api.service
zx ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart zx-ui.service
zx ALL=(ALL) NOPASSWD: /usr/bin/systemctl status zx-api.service
zx ALL=(ALL) NOPASSWD: /usr/bin/systemctl status zx-ui.service
zx ALL=(ALL) NOPASSWD: /usr/bin/systemctl daemon-reload
zx ALL=(ALL) NOPASSWD: /usr/bin/systemctl start postgresql
zx ALL=(ALL) NOPASSWD: /usr/bin/systemctl is-active postgresql
zx ALL=(ALL) NOPASSWD: /usr/bin/cp /home/zx/zx-op/*.service /etc/systemd/system/
zx ALL=(ALL) NOPASSWD: /usr/bin/chmod * /etc/systemd/system/*.service
```

Apply with:
```bash
sudo cp /home/zx/zx-op/ops/sudoers-zx /etc/sudoers.d/zx-op
sudo chmod 440 /etc/sudoers.d/zx-op
sudo visudo -c -f /etc/sudoers.d/zx-op  # Validate syntax
```

### 9.6. File Permissions

| File | Permission | Reason |
|------|------------|--------|
| `/home/zx/zx-op/.env` | 644 | Systemd must read environment variables |
| `/home/zx/zx-op/scripts/*.sh` | 755 | Executable by systemd |
| `/var/log/zx-*/` | 755 (zx:zx) | Logs writable by service user |

### 9.7. Startup & Verification

```bash
# Reload systemd after config changes
sudo -n systemctl daemon-reload

# Restart services
sudo -n systemctl restart zx-ui.service
sudo -n systemctl restart zx-api.service

# Check status
sudo -n systemctl status zx-ui.service

# Verify accessibility
curl -kfsS https://127.0.0.1:8080/ -o /dev/null && echo "UI OK"
curl -fsS http://127.0.0.1:3000/api/health -o /dev/null && echo "API OK"
```

### 9.8. Network Access

The app serves on **HTTPS port 8080** to the entire LAN:
- Local: `https://localhost:8080/`
- Network: `https://<server-ip>:8080/`

Current IP: Check with `hostname -I | awk '{print $1}'`

The `--host 0.0.0.0` flag ensures the service binds to all interfaces, so it survives IP address changes (DHCP renewals, network reconfigurations).

### 9.9. Boot Verification

After reboot, verify services started automatically:
```bash
systemctl is-enabled zx-ui.service zx-api.service  # Should show "enabled"
systemctl is-active zx-ui.service zx-api.service   # Should show "active"
```
