# Deployment Sync Specification

## Summary
This specification defines production deployments for **Zona Xtreme Operation System** on a **customer-hosted Fedora server** using Docker Compose.

Deployment objective:
- run `api + ui + postgres` in Docker,
- synchronize updates from `main` using `origin`,
- perform safe migrations,
- verify health,
- avoid destructive schema sync in production.

## Scope
- Automatic deployment on push to `main`.
- Local build of API and UI images on the production host.
- PostgreSQL persistence in Docker volume.
- Automatic Prisma client generation (`db:generate`) and production migrations (`prisma migrate deploy`).
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
   - Triggered on `push` to `main`.
3. **Self-Hosted Runner (Fedora production host)**
   - Executes deployment script locally.
4. **Docker Compose Stack**
   - `postgres`, `api`, `ui` services.
5. **Operational Scripts**
   - `update-app.sh`, `start-app.sh`.

### High-Level Flow
`push to main -> GitHub Actions on self-hosted runner -> update-app.sh -> git fetch/pull --ff-only -> build api image -> prisma migrate deploy -> docker compose up --build -> health checks`

## Branch and Trigger Policy
- Deploy target branch: `main`.
- Source remote for production sync: `origin`.
- Deployment trigger mode: GitHub Actions `push` event.
- Pull policy: fast-forward only (`git pull --ff-only`).

## Runtime Stack Specification

### PostgreSQL Service
- Image: `postgres:16-alpine`
- Persistent volume: `postgres_data`
- Health check: `pg_isready`
- Credentials and DB name from environment.

### API Service
- Built from `api/Dockerfile`.
- Runtime command: `pnpm --filter api exec prisma migrate deploy && pnpm --filter api start`.
- Startup preflight always attempts safe production migrations before API boot.
- Required endpoint for deploy checks: `GET /api/health`.
- API health endpoint must validate DB connectivity.

### UI Service
- Built from `ui/Dockerfile`.
- Runtime command: `pnpm --filter ui preview --host 0.0.0.0 --port 4173`.
- API base URL/port are injected via environment/config expected by UI build/runtime.

## Deployment Pipeline Specification

### Stage 1: Synchronization
1. Acquire deployment lock to avoid concurrent runs.
2. Validate internet reachability to GitHub.
3. `git fetch origin main`
4. Compare local `HEAD` with `origin/main`.
5. If equal: log and exit without restart.
6. If different: `git pull --ff-only origin main`.

### Stage 2: Migration
1. Ensure DB is running:
   - `docker compose up -d postgres`
2. Build latest API image before migration commands:
   - `docker compose build api`
3. Generate Prisma client:
   - `docker compose run --rm api pnpm --filter api db:generate`
4. Run production migration:
   - `docker compose run --rm api pnpm --filter api exec prisma migrate deploy`
5. If generation/migration fails:
   - deployment fails,
   - application services are not restarted.

### Stage 3: Activation
1. Build and start application services:
   - `docker compose up -d --build api ui`
2. Restart policy remains `unless-stopped`.

### Stage 4: Post-Deploy Health Check
1. Validate API endpoint (default `http://127.0.0.1:3000/api/health`).
2. Validate UI endpoint (default `http://127.0.0.1:4173/`).
3. If any check fails: deployment is marked failed for operator intervention.

## Failure Modes and Expected Behavior
1. No internet/GitHub unreachable:
   - deployment exits safely without changing running services.
2. Git fetch/pull fails:
   - running services are unchanged.
3. Migration fails:
   - deployment fails,
   - running services are unchanged.
4. Build or health check fails:
   - deployment fails,
   - operator intervention required.

## Security and Access Rules
- Run deployment with a dedicated Linux account where possible.
- Keep secrets outside repository when feasible.
- Restrict self-hosted runner and Docker permissions to deployment operator account.
- Keep production host behind local network controls.

## Monitoring and Audit
- Deployment log file: `/var/log/zx-op-deploy.log` (or repository-local fallback).
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
4. Broken migration:
   - deploy fails,
   - previous running services remain active.
5. Host reboot:
   - compose services restart automatically (`unless-stopped`).

## Assumptions and Defaults
- Production source is `main` from `origin`.
- Images are built locally on production host.
- Access is local network via host IP and exposed ports.
- Deploy trigger is GitHub Actions on a self-hosted runner hosted on the same Fedora server.
- PostgreSQL persistence is volume-based and isolated from source updates.
