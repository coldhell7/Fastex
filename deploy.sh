#!/usr/bin/env bash
set -euo pipefail

# ─── Config ────────────────────────────────────────────────────────────────────
SERVER_USER="root"
SERVER_IP="85.198.23.48"
SERVER_DIR="/opt/medalino/src"
SERVICE_NAME="medalino-admin.service"
SSH_PASS="${DEPLOY_PASSWORD:-cloud@506070}"

# ─── Helpers ───────────────────────────────────────────────────────────────────
log()  { echo "[$(date '+%H:%M:%S')] $*"; }
ssh_run() { sshpass -p "$SSH_PASS" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=15 "${SERVER_USER}@${SERVER_IP}" "$@"; }

# ─── Step 1: push local changes ────────────────────────────────────────────────
if [[ "${1:-}" != "--no-push" ]]; then
  log "Pushing local commits to GitHub..."
  git push origin main
fi

# ─── Step 2: pull + build + restart on server ──────────────────────────────────
log "Connecting to ${SERVER_IP}..."

ssh_run bash <<'REMOTE'
set -euo pipefail
log() { echo "[$(date '+%H:%M:%S')] $*"; }

cd /opt/medalino/src

log "Pulling latest code..."
git pull origin main

log "Installing dependencies..."
pnpm install --frozen-lockfile 2>&1 | tail -3

log "Building admin panel..."
pnpm --filter admin build

log "Restarting service..."
systemctl restart medalino-admin.service
sleep 2

STATUS=$(systemctl is-active medalino-admin.service)
if [[ "$STATUS" == "active" ]]; then
  log "Service is UP ✓"
  journalctl -u medalino-admin.service -n 5 --no-pager
else
  log "Service status: $STATUS — check journalctl -u medalino-admin.service"
  exit 1
fi
REMOTE

log "Deploy complete → https://admin.medalino.ir"
