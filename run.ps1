Param(
  [switch]$NoInstall
)

$ErrorActionPreference = 'Stop'

Set-Location (Resolve-Path "$PSScriptRoot")
Write-Host "[entrypoint] Working dir: $PWD"

if (-not (Get-Command pm2 -ErrorAction SilentlyContinue)) {
  Write-Host "[entrypoint] Installing pm2 globally"
  npm install -g pm2 | Out-Null
}

Write-Host "[entrypoint] Launching pipeline script"
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\run-pipeline.ps1 @PSBoundParameters
