#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

OUT="vb-exotel-v0.2.0-pipeline.zip"
TMP_DIR="$ROOT_DIR/vb_exotel_v12_temp"

rm -rf "$TMP_DIR" "$OUT"
mkdir -p "$TMP_DIR"

INCLUDE=(
  app
  components
  hooks
  lib
  models
  scripts
  types
  ws-server.js
  ws-passthrough-verbose.js
  ws-passthrough.js
  ecosystem.config.js
  deploy.sh
  package.json
  package-lock.json
  next.config.ts
  tsconfig.json
  .env.example
  README.md
)

for item in "${INCLUDE[@]}"; do
  if [ -e "$item" ]; then
    if [ -d "$item" ]; then
      rsync -a --exclude node_modules --exclude .next --exclude coverage --exclude '*.zip' "$item" "$TMP_DIR/"
    else
      mkdir -p "$TMP_DIR/$(dirname "$item")"
      cp -f "$item" "$TMP_DIR/$item" 2>/dev/null || true
    fi
  fi
done

(cd "$TMP_DIR" && zip -r "$OUT" . >/dev/null)
mv "$TMP_DIR/$OUT" "$ROOT_DIR/$OUT"
rm -rf "$TMP_DIR"

echo "Created $OUT"
ls -lh "$OUT"
