Param(
  [switch]$NoInstall
)

$ErrorActionPreference = 'Stop'

function Free-Port($port) {
  try {
    $pids = (netstat -ano | Select-String ":$port\s" | ForEach-Object { ($_ -split '\s+')[-1] } | Where-Object { $_ -match '^\d+$' } | Select-Object -Unique)
    foreach ($pid in $pids) { taskkill /PID $pid /F | Out-Null }
  } catch {}
}

Set-Location (Resolve-Path "$PSScriptRoot\..")
Write-Host "[run-pipeline] Working dir: $PWD"

Write-Host "[run-pipeline] Freeing ports 8009 and 8765"
Free-Port 8009
Free-Port 8765

Write-Host "[run-pipeline] Cleaning PM2 apps"
pm2 delete nextjs-api 2>$null | Out-Null
pm2 delete exotel-ws 2>$null | Out-Null

if (-not $NoInstall) {
  Write-Host "[run-pipeline] Installing deps"
  npm ci 2>$null
  if ($LASTEXITCODE -ne 0) { npm install }
}

Write-Host "[run-pipeline] Building Next.js"
npm run build

Write-Host "[run-pipeline] Starting Next.js on 8009"
pm2 start npm --name nextjs-api -- run start -- -p 8009 -H 0.0.0.0

Write-Host "[run-pipeline] Starting WebSocket server on 8765"
pm2 start ws-server.js --name exotel-ws --env API_BASE_URL=http://127.0.0.1:8009

Write-Host "[run-pipeline] Quick health checks"
try { (Invoke-WebRequest http://localhost:8009/api/exotel/passthru -UseBasicParsing).Content | Write-Host } catch {}
try { (Invoke-WebRequest http://localhost:8765/health -UseBasicParsing).Content | Write-Host } catch {}

Write-Host "[run-pipeline] Streaming PM2 logs (Ctrl+C to exit)"
pm2 logs --timestamp
