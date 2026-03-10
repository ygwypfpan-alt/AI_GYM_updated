$ErrorActionPreference = 'Stop'

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir
Set-Location $RootDir

$NodeExe = Join-Path $env:USERPROFILE 'tools\node20\node.exe'
$PnpmCmd = Join-Path $env:LOCALAPPDATA 'pnpm\pnpm.cmd'

if (-not (Test-Path $NodeExe)) {
  $nodeCommand = Get-Command node -ErrorAction SilentlyContinue
  if ($nodeCommand) {
    $NodeExe = $nodeCommand.Source
  }
}

if (-not (Test-Path $NodeExe)) {
  throw 'node.exe not found. Please restore Node 20 before starting dev.'
}

if (-not (Test-Path $PnpmCmd)) {
  throw 'pnpm.cmd not found. Please install pnpm or restore %LOCALAPPDATA%\pnpm\pnpm.cmd.'
}

PowerShell -ExecutionPolicy Bypass -File '.\scripts\ensure-postgres.ps1'
& $NodeExe '.\scripts\sync-env.mjs'
& $PnpmCmd --filter @ai-gym/shared build
& $PnpmCmd --filter @ai-gym/db build
& $PnpmCmd --parallel --filter @ai-gym/api --filter @ai-gym/web dev
