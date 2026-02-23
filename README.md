# Zona Xtreme Operation System

Local-first operation platform for Zona Xtreme, with real-time synchronization between check-in, operation, monitor, and reports views.

## Tech Stack
- API: Node.js + Fastify + Prisma
- UI: React + Vite + PWA
- DB: PostgreSQL
- Realtime: Socket.IO
- Runtime: Docker Compose

## Production Runtime (Fedora Server + LAN)
This repository includes a Docker Compose production model for:
- `postgres`
- `api`
- `ui`

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

### Manual Start
```bash
./start-app.sh
```

This script:
1. Detects host LAN IP and refreshes `.env`.
2. Starts `postgres`.
3. Builds latest `api` image.
4. Runs Prisma `db:generate`.
5. Runs Prisma `migrate deploy` (safe for production).
6. Builds and starts `api` + `ui` (API startup also runs `migrate deploy` preflight).
7. Validates `/api/health` and UI root.

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
4. Ensure runner user can execute Docker (`docker` group).

### Verification steps
After pushing a commit to `main`:
```bash
# On Fedora server
sudo tail -n 100 /var/log/zx-op-deploy.log
cd /home/zx/zx-op && git rev-parse HEAD
docker compose ps
curl -fsS http://127.0.0.1:3000/api/health
curl -fsS http://127.0.0.1:4173/
```

## Development
```bash
pnpm install
pnpm dev:all
```

## Deployment Spec
Full operational contract:
- `/specs/deployment-sync-spec.md`
