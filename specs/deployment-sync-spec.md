# Deployment Sync Specification

## Summary
This specification defines how production deployments are executed for **Zona Xtreme Operation System** when code is pushed to `main`.  
The objective is to ensure safe, automatic, and recoverable updates on a customer-hosted server using GitHub Actions with a self-hosted runner.

## Scope
- Automatic deployment on every push to `main`.
- Build and restart of API/UI services on customer server.
- Database migration execution in production-safe mode.
- Health checks and rollback strategy.
- Operational rules for downtime minimization.

## Out of Scope
- Functional feature changes in API/UI.
- Data model redesign.
- Multi-region or cloud-native orchestration.

## Deployment Architecture

### Components
1. **GitHub Repository**
   - Source of truth for `main`.
2. **GitHub Actions Workflow**
   - Validates and triggers deployment.
3. **Self-hosted Runner (Customer Server)**
   - Executes deployment steps locally.
4. **PostgreSQL**
   - Persistent storage.
5. **Process Manager**
   - `systemd` services for API and UI delivery (`nginx` or equivalent static server).

### High-Level Flow
`push to main -> GitHub Action starts -> self-hosted runner pulls/builds/migrates -> restart services -> health check -> success/failure report`

## Environments and Paths (Default)
- App root: `/opt/zx-op`
- Release folders: `/opt/zx-op/releases/<timestamp>-<short_sha>`
- Current symlink: `/opt/zx-op/current`
- Previous symlink metadata: `/opt/zx-op/previous`
- Logs: `journalctl -u zx-api`, web server logs

## Branch and Trigger Policy
- Deploy trigger: `push` events on `main`.
- Recommended protection for `main`:
  - PR required
  - Status checks required (build/tests)
  - No direct force push

## Deployment Pipeline Specification

### Stage 1: Pre-Deployment Validation
1. Checkout repository.
2. Install dependencies (`pnpm install --frozen-lockfile`).
3. Run checks:
   - `pnpm lint`
   - `pnpm --filter api build`
   - `pnpm --filter @zx-op/ui build`
   - Optional tests (`pnpm --filter api test`, `pnpm --filter @zx-op/ui test`)

### Stage 2: Release Preparation (on customer server)
1. Create release directory under `/opt/zx-op/releases/...`.
2. Sync repository content into new release folder.
3. Install dependencies in release.
4. Build API and UI artifacts.

### Stage 3: Database Migration
1. Run Prisma generate (`pnpm --filter api db:generate`).
2. Run production migration command:
   - `prisma migrate deploy` (via API workspace command).
3. If migration fails:
   - Mark deployment as failed.
   - Do not switch `current` symlink.
   - Keep running previous stable release.

### Stage 4: Activation
1. Save old `current` target into `previous`.
2. Point `current` symlink to new release.
3. Restart services:
   - `systemctl restart zx-api`
   - `systemctl reload nginx` (or restart UI static service)

### Stage 5: Post-Deployment Health Check
1. Call API health endpoint (recommended: `GET /api/health`).
2. Verify UI static host responds.
3. If health check fails:
   - rollback to `previous`
   - restart services
   - mark deployment failed.

## Service Management Specification

### API Service (`systemd`)
- Runs compiled entrypoint from `/opt/zx-op/current/api/dist/server.cjs`.
- Restart policy: `Restart=always`.
- Starts on boot: `WantedBy=multi-user.target`.
- Uses `.env` outside repository for sensitive values.

### UI Service
- Preferred: static build served by `nginx`.
- Serve `/opt/zx-op/current/ui/dist`.
- Cache headers configured to avoid stale critical assets after deploy.

## Public Interfaces and Operational Additions

### New/Required Operational Interface
- `GET /api/health`
  - Returns service status and basic DB connectivity signal.
  - Used exclusively for deploy verification and monitoring.

### No Functional API Contract Changes
- Existing business endpoints remain unchanged.

## Rollback Specification
1. Read `previous` symlink target.
2. Re-point `current` to `previous`.
3. Restart API + reload/restart UI server.
4. Run health checks.
5. Record rollback event with commit hash and timestamp.

## Failure Modes and Expected Behavior
1. Build fails:
   - No activation; current production remains unchanged.
2. Migration fails:
   - No activation; rollback not needed if symlink not switched.
3. Service restart fails:
   - Attempt rollback immediately.
4. Health check fails after activation:
   - Auto rollback to previous stable release.

## Security and Access Rules
- Dedicated OS user for deployment (non-root where possible).
- Least-privilege permissions for runner and service files.
- Secrets stored in server environment, not committed.
- Runner labels restricted to deployment workflow only.

## Testing and Acceptance Scenarios
1. Push with frontend-only change:
   - Pipeline succeeds, UI updated, API remains healthy.
2. Push with backend change and migration:
   - Migration applied, API healthy, data preserved.
3. Intentionally broken build:
   - Deployment blocked, production unchanged.
4. Intentionally broken migration:
   - Deployment blocked, production unchanged.
5. Simulated post-deploy failure:
   - Automatic rollback succeeds.
6. Server reboot:
   - Services auto-start and load active `current` release.

## Monitoring and Audit
- Keep deployment log entries: commit SHA, actor, start/end time, result.
- Keep rollback log entries with reason and restored release.
- GitHub Actions retains workflow history for audit trail.

## Assumptions and Defaults
- Repository is reachable from customer server via GitHub.
- Deployment is Linux-based with `systemd`.
- PostgreSQL data is persistent and external to app release folders.
- UI is built statically and served by web server.
- Default deploy target is `main` only.
