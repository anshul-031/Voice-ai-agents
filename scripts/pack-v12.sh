#!/usr/bin/env bash
set -euo pipefail

OUT="${1:-vb-exotel-v0.2.0-pipeline.zip}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMPDIR="${ROOT}/vb_exotel_v12_temp"

cleanup() {
  rm -rf "$TMPDIR"
}
trap cleanup EXIT

rm -rf "$TMPDIR"
mkdir -p "$TMPDIR"

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
  run.sh
  run.ps1
  ecosystem.config.js
  deploy.sh
  package.json
  package-lock.json
  next.config.ts
  tsconfig.json
  .env.example
  README.md
)

EXCLUDE=(
  node_modules
  .next
  coverage
  "*.zip"
  "vb_exotel_source_*.zip"
)

rsync_excludes=()
for pattern in "${EXCLUDE[@]}"; do
  rsync_excludes+=("--exclude" "$pattern")
done

cd "$ROOT"
for item in "${INCLUDE[@]}"; do
  if [[ -e "$item" ]]; then
    if [[ -d "$item" ]]; then
      rsync -a "${rsync_excludes[@]}" "$item/" "$TMPDIR/$item/"
    else
      mkdir -p "$TMPDIR/$(dirname "$item")"
      rsync -a "$item" "$TMPDIR/$item"
    fi
  fi
done

# Normalize .sh files to LF
find "$TMPDIR" -type f -name "*.sh" -print0 | while IFS= read -r -d '' file; do
  sed -i 's/\r$//' "$file"
done

rm -f "$OUT"
if command -v zip >/dev/null 2>&1; then
  (cd "$TMPDIR" && zip -r "${OUT}" .)
  mv "$TMPDIR/${OUT}" "$ROOT/${OUT}"
else
  (cd "$TMPDIR" && tar -a -c -f "$ROOT/${OUT}" .)
fi

echo "Created ${OUT}"
ls -lh "$ROOT/${OUT}"
