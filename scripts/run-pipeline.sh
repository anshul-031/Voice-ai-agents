#!/usr/bin/env bash
set -euo pipefail

# Run full Exotel pipeline (Next.js API on 8009 + WS on 8765) with PM2 and show logs

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "[run-pipeline] Working dir: $PWD"

echo "[run-pipeline] Freeing ports 8009 and 8765 (ignore errors if none)"
sudo fuser -k 8009/tcp || true
sudo fuser -k 8765/tcp || true

echo "[run-pipeline] Cleaning PM2 apps"
pm2 delete nextjs-api || true
pm2 delete exotel-ws || true

echo "[run-pipeline] Installing deps"
npm ci || npm install

echo "[run-pipeline] Building Next.js"
npm run build

echo "[run-pipeline] Starting Next.js on 8009"
pm2 start npm --name nextjs-api -- run start -- -p 8009 -H 0.0.0.0

echo "[run-pipeline] Starting WebSocket server on 8765"
pm2 start ws-server.js --name exotel-ws --env API_BASE_URL=http://127.0.0.1:8009

echo "[run-pipeline] Quick health checks"
curl -sf http://localhost:8009/api/exotel/passthru || true
curl -sf http://localhost:8765/health || true

echo "[run-pipeline] Streaming PM2 logs (Ctrl+C to exit)"
pm2 logs --timestamp
