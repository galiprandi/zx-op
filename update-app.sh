#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$SCRIPT_DIR"
LOCK_FILE="/tmp/zx-op-deploy.lock"
LOG_FILE="/var/log/zx-op-deploy.log"

if [[ ! -w "$(dirname "$LOG_FILE")" ]]; then
  LOG_FILE="$APP_DIR/ops/logs/deploy.log"
fi

mkdir -p "$(dirname "$LOG_FILE")"
cd "$APP_DIR"

exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  echo "[$(date -Is)] deploy skipped: another deployment is running" | tee -a "$LOG_FILE"
  exit 0
fi

# Optional: allow offline runs (comment out to enforce internet check)
# if ! curl -fsS --max-time 8 https://github.com >/dev/null; then
#   echo "[$(date -Is)] deploy skipped: no internet/GitHub unreachable" | tee -a "$LOG_FILE"
#   exit 0
# fi

echo "[$(date -Is)] checking updates from origin/main" | tee -a "$LOG_FILE"
git fetch origin main

LOCAL_SHA=$(git rev-parse HEAD)
REMOTE_SHA=$(git rev-parse origin/main)

if [[ "$LOCAL_SHA" == "$REMOTE_SHA" ]]; then
  echo "[$(date -Is)] no changes: $LOCAL_SHA" | tee -a "$LOG_FILE"
  exit 0
fi

echo "[$(date -Is)] deploying $REMOTE_SHA" | tee -a "$LOG_FILE"
git pull --ff-only origin main

"$APP_DIR/start-app.sh"

echo "[$(date -Is)] deployment ok: $(git rev-parse HEAD)" | tee -a "$LOG_FILE"
