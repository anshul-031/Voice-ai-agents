#!/usr/bin/env bash
set -euo pipefail

# One-command entrypoint for Linux/macOS
# Usage after unzip:  bash run.sh

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

echo "[entrypoint] Working dir: $PWD"

echo "[entrypoint] Normalizing shell scripts to LF and ensuring exec bit"
if command -v dos2unix >/dev/null 2>&1; then
  dos2unix -q scripts/*.sh 2>/dev/null || true
else
  for f in scripts/*.sh; do
    [ -f "$f" ] || continue
    # Remove CR from CRLF
    sed -i 's/\r$//' "$f" || true
  done
fi
chmod +x scripts/*.sh 2>/dev/null || true

echo "[entrypoint] Checking pm2 availability"
if ! command -v pm2 >/dev/null 2>&1; then
  echo "[entrypoint] Installing pm2 globally (requires npm)"
  npm install -g pm2 || true
fi

echo "[entrypoint] Launching pipeline"
exec bash scripts/run-pipeline.sh "$@"
