Param(
  [string]$Out = "vb-exotel-v0.2.0-pipeline.zip"
)

$ErrorActionPreference = 'Stop'
Set-Location (Resolve-Path "$PSScriptRoot\..")

$include = @(
  'app',
  'components',
  'hooks',
  'lib',
  'models',
  'scripts',
  'types',
  'ws-server.js',
  'ws-passthrough-verbose.js',
  'ws-passthrough.js',
  'ecosystem.config.js',
  'deploy.sh',
  'package.json',
  'package-lock.json',
  'next.config.ts',
  'tsconfig.json',
  '.env.example',
  'README.md'
)

$exclude = @('node_modules', '.next', 'coverage', '*.zip', 'vb_exotel_source_*.zip')

$temp = Join-Path $PWD "vb_exotel_v12_temp"
if (Test-Path $temp) { Remove-Item -Recurse -Force $temp }
New-Item -ItemType Directory -Path $temp | Out-Null

foreach ($item in $include) {
  if (Test-Path $item) {
    if ((Get-Item $item).PSIsContainer) {
      Copy-Item $item -Destination $temp -Recurse -Force -Exclude $exclude
    } else {
      Copy-Item $item -Destination (Join-Path $temp (Split-Path $item -Parent)) -Force -ErrorAction SilentlyContinue
    }
  }
}

if (Test-Path $Out) { Remove-Item $Out -Force }
try {
  Add-Type -AssemblyName System.IO.Compression.FileSystem -ErrorAction Stop
  [System.IO.Compression.ZipFile]::CreateFromDirectory($temp, $Out)
} catch {
  Write-Warning "ZipFile failed, trying tar fallback: $_"
  tar -a -c -f $Out -C $temp .
}

Write-Host "Created $Out"
Get-Item $Out | Select-Object Name, Length, CreationTime | Format-Table -AutoSize
