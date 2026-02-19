# Deployment Sync Specification

## Summary
This specification defines production deployments for **Zona Xtreme Operation System** on a **customer-hosted Windows 11 machine** using Docker Compose.

Deployment objective:
- run `api + ui + postgres` in Docker,
- synchronize updates from `main` using a LAN Git remote,
- perform safe migrations,
- verify health,
- rollback automatically on failure.

## Scope
- Automatic deployment for new commits on `main`.
- Local build of API and UI images on the production host.
- PostgreSQL persistence in Docker volume.
- Automatic Prisma client generation (`prisma generate`) and production migrations (`prisma migrate deploy`).
- Automatic rollback to previous image tags on failed deployment.
- Windows Task Scheduler based polling.

## Out of Scope
- Functional feature changes in API/UI.
- Cloud/CDN/Kubernetes deployment models.
- Public internet webhook exposure.

## Deployment Architecture

### Components
1. **LAN Git Remote (`lan-origin`)**
   - Source used by production for deployment synchronization.
2. **Windows Task Scheduler**
   - Triggers deployment polling every minute.
3. **Production Host (Windows 11 Acer)**
   - Executes `ops/deploy.ps1`.
4. **Docker Compose Stack**
   - `postgres`, `api`, `ui` services.
5. **Operational Scripts**
   - `ops/deploy.ps1`, `ops/rollback.ps1`, `ops/healthcheck.ps1`.
   - `ops/start-system.ps1`, `ops/stop-system.ps1`, `ops/install-autostart.ps1`.

### High-Level Flow
`push to LAN main -> scheduler triggers deploy.ps1 -> git fetch/pull -> docker compose build -> prisma generate -> prisma migrate deploy -> docker compose up -> health checks -> success or rollback`

## Branch and Trigger Policy
- Deploy target branch: `main`.
- Source remote for production sync: `lan-origin`.
- Deployment trigger mode: polling every 1 minute.
- Pull policy: fast-forward only (`git pull --ff-only`).

## Runtime Stack Specification

### PostgreSQL Service
- Image: `postgres:16-alpine`
- Persistent volume: `postgres_data`
- Health check: `pg_isready`
- Credentials and DB name from environment.

### API Service
- Built from `api/Dockerfile`.
- Runtime command: `pnpm --filter api start`.
- Required endpoint for deploy checks: `GET /api/health`.
- API health endpoint must validate DB connectivity.

### UI Service
- Built from `ui/Dockerfile`.
- Runtime command: `pnpm --filter ui preview --host 0.0.0.0 --port 4173`.
- API base URL/port are injected at build time via compose build args.

### Operator-Friendly Runtime Controls
- `ops/start-system.ps1` starts the complete stack (`postgres`, `prisma generate`, migrations, `api`, `ui`) with health checks.
- `ops/stop-system.ps1` stops the full stack.
- `ops/install-autostart.ps1` registers Windows tasks for startup and periodic deploy polling.
- `.cmd` wrappers are provided for non-technical operators.

## Deployment Pipeline Specification

### Stage 1: Synchronization
1. Acquire deployment lock to avoid concurrent runs.
2. `git fetch lan-origin main`
3. Compare local `HEAD` with `lan-origin/main`.
4. If equal: log and exit without restart.
5. If different: `git pull --ff-only lan-origin main`.

### Stage 2: Release Build
1. Save rollback image tags:
   - `zx-op-api:local -> zx-op-api:prev`
   - `zx-op-ui:local -> zx-op-ui:prev`
2. Build images:
   - `docker compose build api ui`

### Stage 3: Migration
1. Ensure DB is running:
   - `docker compose up -d postgres`
2. Generate Prisma client:
   - `docker compose run --rm api pnpm --filter api db:generate`
3. Run production migration:
   - `docker compose run --rm api pnpm --filter api exec prisma migrate deploy`
4. If generation/migration fails:
   - deployment fails,
   - rollback starts,
   - previous stable images remain active.

### Stage 4: Activation
1. Start/restart application services:
   - `docker compose up -d api ui`
2. Restart policy remains `unless-stopped`.

### Stage 5: Post-Deploy Health Check
1. Validate API endpoint (default `http://127.0.0.1:3000/api/health`).
2. Validate UI endpoint (default `http://127.0.0.1:4173/`).
3. If any check fails: trigger rollback.

## Rollback Specification
1. Retag rollback images back to active tags:
   - `zx-op-api:prev -> zx-op-api:local`
   - `zx-op-ui:prev -> zx-op-ui:local`
2. `docker compose up -d --no-build postgres api ui`
3. Re-run health checks.
4. Log rollback status and reason.

## Failure Modes and Expected Behavior
1. Git fetch/pull fails:
   - running services are unchanged,
   - next scheduler cycle retries.
2. Build fails:
   - deployment marked failed,
   - rollback attempted.
3. Migration fails:
   - deployment marked failed,
   - rollback attempted.
4. Health check fails:
   - rollback attempted automatically.
5. Rollback fails:
   - error logged for manual intervention.

## Security and Access Rules
- Run deployment script with a dedicated Windows account where possible.
- Keep secrets outside repository when feasible.
- Restrict Task Scheduler permissions to deployment operator account.
- Keep production host behind local network controls.

## Monitoring and Audit
- Deployment log file: `ops/logs/deploy.log`
- Log fields: timestamp, commit SHA, duration, result.
- Diagnostics source:
  - `docker compose logs api`
  - `docker compose logs ui`
  - `docker compose logs postgres`

## Testing and Acceptance Scenarios
1. Frontend-only commit:
   - deploy succeeds,
   - UI reflects new build,
   - API health remains OK.
2. Backend + migration commit:
   - migration applies,
   - API health OK,
   - data preserved.
3. No-change cycle:
   - no build/restart.
4. Broken build:
   - deploy fails,
   - previous version remains running.
5. Broken migration:
   - deploy fails,
   - previous version remains running.
6. Post-deploy runtime failure:
   - rollback runs and restores service.
7. Host reboot:
   - compose services restart automatically (`unless-stopped`).

## Assumptions and Defaults
- Production source is `main` from `lan-origin`.
- Images are built locally on production host.
- Access is local network via host IP and exposed ports.
- Deploy uses polling, not public webhooks.
- PostgreSQL persistence is volume-based and isolated from source updates.
