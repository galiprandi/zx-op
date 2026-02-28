# Zona Xtreme Operation System

Local-first operation platform for Zona Xtreme, with real-time synchronization between check-in, operation, monitor, and reports views.

## Tech Stack
- API: Node.js + Fastify + Prisma
- UI: React + Vite + PWA
- DB: PostgreSQL (native)
- Realtime: Socket.IO
- Runtime: systemd services (Fedora)

## Production Runtime (Fedora Server + LAN)
This repository runs natively on Fedora using systemd services:
- `postgresql.service` (system package)
- `zx-api.service` (Node API)
- `zx-ui.service` (Vite preview server)

### Required Environment Variables
Set these in `.env` at repository root:

```env
POSTGRES_DB=zx_op
POSTGRES_USER=zx_user
POSTGRES_PASSWORD=zx_password
POSTGRES_PORT=5432
API_PORT=3000
UI_PORT=4173
PUBLIC_API_BASE_URL=http://192.168.68.62
```

`PUBLIC_API_BASE_URL` must be the LAN IP used by client devices to reach the API.

### First-time Setup (systemd services)
```bash
# Install systemd units and enable them
sudo ./ops/install-services.sh
```

### Manual Start (full build + restart)
```bash
./start-app.sh
```

This script:
1. Detects host LAN IP and updates `.env`.
2. Installs/updates dependencies with pnpm.
3. Ensures PostgreSQL is running.
4. Runs Prisma `db:generate` and `migrate deploy`.
5. Builds API (`api/dist`) and UI (`ui/dist`).
6. Restarts `zx-api.service` and `zx-ui.service`.
7. Validates `/api/health` and UI root.

### Quick Restart (no rebuild)
```bash
./ops/restart-services.sh
```

### Health Validation
- API: `http://<server-ip>:3000/api/health`
- UI: `http://<server-ip>:4173/`

## Auto-Deploy on Push to `main` (Fedora)

### Overview
Deploy is executed by GitHub Actions on a self-hosted runner installed on the same Fedora server.

Workflow file:
- `.github/workflows/deploy-main-fedora.yml`

Deployment script:
- `update-app.sh`

### Deployment behavior
1. Acquires a file lock to avoid concurrent deploys.
2. Verifies internet/GitHub reachability.
3. `git fetch origin main`.
4. If commit changed: `git pull --ff-only origin main`.
5. Runs `./start-app.sh`.
6. Writes deployment log (`/var/log/zx-op-deploy.log` or `ops/logs/deploy.log`).

### Self-hosted runner requirements
On Fedora server:
1. Install GitHub Actions self-hosted runner.
2. Register labels including: `self-hosted`, `linux`, `fedora`.
3. Keep runner service enabled (`systemctl`).
4. Ensure runner user can run `pnpm` and `systemctl` (no Docker needed).

### Verification steps
After pushing a commit to `main`:
```bash
# On Fedora server
sudo tail -n 100 /var/log/zx-op-deploy.log
cd /home/zx/zx-op && git rev-parse HEAD
systemctl status zx-api.service zx-ui.service
curl -fsS http://127.0.0.1:3000/api/health
curl -fsS http://127.0.0.1:4173/
```

## Fallback to Docker (if needed)
If you need to revert to the Docker-based runtime:
```bash
git checkout main  # switch to Docker branch
# Follow the old README instructions (Docker Compose)
```

## Development
```bash
pnpm install
pnpm dev:all
```

## Deployment Spec
Full operational contract:
- `/specs/deployment-sync-spec.md`
