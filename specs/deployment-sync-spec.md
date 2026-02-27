# Deployment Sync Specification

## Summary
This specification defines production deployments for **Zona Xtreme Operation System** on a **customer-hosted Fedora server** without Docker. The runtime now uses native services (systemd) for PostgreSQL, API and UI while still relying on a GitHub runner that compiles artifacts whenever the host temporarily has internet. The production host must continue working when offline.

Deployment objective:
- run `postgres + api + ui` as local services managed by systemd,
- synchronize updates from `main` using `origin` whenever internet is available,
- perform safe Prisma migrations before restarting the API,
- publish the built UI assets to a static preview server,
- verify health and keep rollback procedures documented.

## Scope
- Automatic deployment on push to `main` when the GitHub runner has internet.
- GitHub runner builds API (Node/Fastify) and UI (Vite static bundle) artifacts and copies them locally.
- Production Fedora host runs PostgreSQL 16 natively with system service and persistent data directory.
- Automatic Prisma client generation (`db:generate`) and production migrations (`prisma migrate deploy`) executed directly on the host.
- Commit-aware deployments with lock to avoid concurrent runs.

## Out of Scope
- Functional feature changes in API/UI.
- Cloud/CDN/Kubernetes deployment models.
- Public inbound webhook exposure on the production host.

## Deployment Architecture

### Components
1. **GitHub Repository (`origin`)**
   - Source used by production for deployment synchronization.
2. **GitHub Actions Workflow**
   - Triggered on `push` to `main` whenever the host has internet.
3. **Self-Hosted Runner (Fedora production host)**
   - Executes deployment script locally, builds artifacts and stores them even if the host goes offline after the build finishes.
4. **System Services**
   - `postgresql.service` (native installation), `zx-api.service`, `zx-ui.service` managed through systemd.
5. **Operational Scripts**
   - `update-app.sh`, `start-app.sh`, `ops/install-services.sh`, `ops/restart-services.sh`.

### High-Level Flow
`push to main -> GitHub Actions on self-hosted runner -> update-app.sh -> git fetch/pull --ff-only -> build api dist + ui dist -> prisma migrate deploy -> restart zx-api.service + zx-ui.service -> health checks`

## Branch and Trigger Policy
- Deploy target branch: `main`.
- Source remote for production sync: `origin`.
- Deployment trigger mode: GitHub Actions `push` event.
- Pull policy: fast-forward only (`git pull --ff-only`).

## Runtime Stack Specification

### PostgreSQL Service
- Fedora native `postgresql-16` installation managed via `systemctl`.
- Data directory: `/var/lib/pgsql/zx_op` (owned by `postgres`).
- Service enabled with `systemctl enable --now postgresql`.
- Health check: `pg_isready -U zx_user -d zx_op`.
- Connection string stored in `.env` (`DATABASE_URL`).

### API Service (`zx-api.service`)
- Built via `pnpm --filter api build` producing `api/dist/server.cjs`.
- Runtime command: `NODE_ENV=production node dist/server.cjs` executed with systemd under user `zx`.
- Pre-start ExecStartPre hook runs `pnpm --filter api db:generate` and `pnpm --filter api exec prisma migrate deploy`.
- Environment loaded from `/home/zx/zx-op/.env`.
- Required endpoint for deploy checks: `GET http://127.0.0.1:3000/api/health` and must validate DB connectivity.

### UI Service (`zx-ui.service`)
- Build artifacts generated via `pnpm --filter ui build` stored in `/home/zx/zx-op/ui/dist`.
- Served by `pnpm --filter ui preview --host 0.0.0.0 --port 4173` (or a lightweight static server) managed by systemd.
- Environment variables `VITE_API_BASE_URL` and `VITE_API_BASE_PORT` resolved from `.env` before build.

## Deployment Pipeline Specification

### Stage 1: Synchronization
1. Acquire deployment lock to avoid concurrent runs (`flock /tmp/zx-op-deploy.lock`).
2. Validate internet reachability to GitHub; if offline skip fetch but keep previously built artifacts.
3. When online: `git fetch origin main` and compare local `HEAD` with `origin/main`.
4. If equal: log and exit without restarting services.
5. If different: `git pull --ff-only origin main`.

### Stage 2: Build & Migration
1. Ensure PostgreSQL service is running: `systemctl is-active postgresql` (start if inactive).
2. Install project dependencies once (pnpm install) when the runner has internet; cache `node_modules` under `/home/zx/.local/share/pnpm`.
3. Generate Prisma client: `pnpm --filter api db:generate`.
4. Run production migration: `pnpm --filter api exec prisma migrate deploy`.
5. Build API: `pnpm --filter api build`.
6. Build UI: `pnpm --filter ui build` (ensuring `.env` has the current IP for `VITE_API_BASE_URL`).
7. If any command fails, abort deployment and do not restart services.

### Stage 3: Activation
1. Reload systemd units to pick up new binaries: `systemctl daemon-reload`.
2. Restart API: `systemctl restart zx-api.service`.
3. Restart UI: `systemctl restart zx-ui.service`.
4. Ensure both services are `active (running)` before continuing.

### Stage 4: Post-Deploy Health Check
1. Validate API endpoint: `curl -fsS http://127.0.0.1:3000/api/health`.
2. Validate UI endpoint: `curl -fsS http://127.0.0.1:4173/`.
3. If any check fails, rollback by checkout to previous commit and rerun `start-app.sh`.

## Failure Modes and Expected Behavior
1. No internet/GitHub unreachable:
   - deployment exits safely without changing running services; existing builds keep running.
2. Git fetch/pull fails:
   - running services are unchanged.
3. Migration or build fails:
   - deployment fails, services keep previous version.
4. Health check fails:
   - restart is rolled back, operator notified.

## Security and Access Rules
- Run deployment with a dedicated Linux account where possible.
- Keep secrets outside repository when feasible.
- Restrict self-hosted runner and Docker permissions to deployment operator account.
- Keep production host behind local network controls.

## Monitoring and Audit
- Deployment log file: `/var/log/zx-op-deploy.log` (or repository-local fallback).
- Log fields: timestamp, commit SHA, duration, result, systemd status.
- Diagnostics source:
  - `journalctl -u zx-api.service`
  - `journalctl -u zx-ui.service`
  - `journalctl -u postgresql.service`

## Testing and Acceptance Scenarios
1. Frontend-only commit:
   - UI build succeeds,
   - `zx-ui.service` restarts and serves new assets,
   - API health remains OK.
2. Backend + migration commit:
   - migration applies,
   - `zx-api.service` restarts and health check passes,
   - data preserved.
3. No-change cycle:
   - no build/restart when commits are identical.
4. Broken migration/build:
   - deployment fails, previous services keep running.
5. Host reboot:
   - `postgresql`, `zx-api`, `zx-ui` services restart automatically via systemd.

## Offline Operation
- Runner may lose internet after fetching code; builds must succeed using cached dependencies.
- `.env` IP updates happen at runtime via `start-app.sh` without rebuilding artifacts.
- No external Docker registries or npm registries are contacted on the offline host; dependencies must be cached beforehand.

## Assumptions and Defaults
- Production source is `main` from `origin`.
- Images are built locally on production host.
- Access is local network via host IP and exposed ports.
- Deploy trigger is GitHub Actions on a self-hosted runner hosted on the same Fedora server.
- PostgreSQL persistence is volume-based and isolated from source updates.
