# Zona Xtreme Operation System

Local-first operation platform for Zona Xtreme, with real-time synchronization between check-in, operation, monitor, and reports views.

## Tech Stack
- API: Node.js + Fastify + Prisma
- UI: React + Vite + PWA
- DB: PostgreSQL
- Realtime: Socket.IO
- Runtime: Docker Compose

## Production Runtime (Windows 11 + LAN)
This repository includes a Docker Compose production model for:
- `postgres`
- `api`
- `ui`

### Prerequisites
- Docker Desktop (or Docker Engine + Compose) installed on the Windows host
- Git installed
- PowerShell execution policy allowing local scripts
- LAN Git remote configured as `lan-origin`

### Required Environment Variables
Set these in `.env` at repository root:

```env
POSTGRES_DB=zx_op
POSTGRES_USER=zx_user
POSTGRES_PASSWORD=zx_password
POSTGRES_PORT=5432
API_PORT=3000
UI_PORT=4173
PUBLIC_API_BASE_URL=http://192.168.68.100
```

`PUBLIC_API_BASE_URL` must be the LAN IP used by client devices to reach the API.

### Manual First Start
```bash
docker compose build api ui
docker compose up -d postgres
docker compose run --rm api pnpm --filter api exec prisma migrate deploy
docker compose up -d api ui
```

### Health Validation
- API: `http://<server-ip>:3000/api/health`
- UI: `http://<server-ip>:4173/`

## Auto-Deploy by Polling (`main` from LAN remote)
Operational scripts are in `/ops`:
- `ops/deploy.ps1`
- `ops/rollback.ps1`
- `ops/healthcheck.ps1`
- `ops/start-system.ps1`
- `ops/stop-system.ps1`
- `ops/install-autostart.ps1`

### Deploy Script Behavior
1. lock execution to avoid overlapping deploys
2. `git fetch lan-origin main`
3. compare local/remote commit
4. if changed: `git pull --ff-only`
5. tag rollback images (`:prev`)
6. build `api` and `ui`
7. run `prisma generate`
8. run `prisma migrate deploy`
9. restart stack
10. run API/UI health checks
11. rollback automatically on failure

### Windows Task Scheduler Setup
Create a task that runs every 1 minute:

- Program: `powershell.exe`
- Arguments:
  ```text
  -ExecutionPolicy Bypass -File C:\path\to\zx-op\ops\deploy.ps1
  ```
- Start in:
  ```text
  C:\path\to\zx-op
  ```
- Run whether user is logged on or not

## End-User Startup (Simple Mode)
For non-technical operators on Windows:

1. Double-click:
   - `ops/START_SYSTEM.cmd` to start the full system (`db + api + ui`)
   - `ops/STOP_SYSTEM.cmd` to stop it
2. Run once (as Administrator):
   - `ops/INSTALL_AUTOSTART.cmd`
   - This installs:
     - `ZXOP-StartSystem` on Windows startup
     - `ZXOP-AutoDeploy` every 1 minute

PowerShell direct commands:

```powershell
powershell -ExecutionPolicy Bypass -File .\ops\start-system.ps1
powershell -ExecutionPolicy Bypass -File .\ops\install-autostart.ps1
```

## About `db:generate`
- End users do not need to decide this.
- `db:generate` is executed automatically by:
  - `ops/start-system.ps1`
  - `ops/deploy.ps1`
- This guarantees Prisma Client compatibility on every startup/deploy cycle.

## Development
```bash
pnpm install
pnpm dev:all
```

## Deployment Spec
Full operational contract:
- `/specs/deployment-sync-spec.md`
