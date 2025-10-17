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
  'run.sh',
  'run.ps1',
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

# Normalize line endings for .sh files inside temp (remove CR from CRLF) and write without BOM
Get-ChildItem -Path $temp -Recurse -Include *.sh -ErrorAction SilentlyContinue | ForEach-Object {
  try {
    $content = Get-Content -Raw -Encoding Byte $_.FullName
    # Replace CRLF (0D 0A) with LF (0A)
    $normalized = @()
    for ($i = 0; $i -lt $content.Length; $i++) {
      if ($i -lt ($content.Length - 1) -and $content[$i] -eq 13 -and $content[$i+1] -eq 10) {
        $normalized += 10
        $i++
      } else {
        $normalized += $content[$i]
      }
    }
    # Write bytes back without BOM
    [IO.File]::WriteAllBytes($_.FullName, [byte[]]$normalized)
  } catch {}
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
