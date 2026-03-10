$ErrorActionPreference = 'Stop'

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir
Set-Location $RootDir

$NodeExe = Join-Path $env:USERPROFILE 'tools\node20\node.exe'
$PnpmCmd = Join-Path $env:LOCALAPPDATA 'pnpm\pnpm.cmd'
$PowerShellExe = Join-Path $env:WINDIR 'System32\WindowsPowerShell\v1.0\powershell.exe'
$LogDir = Join-Path $RootDir '.codex-logs'
$WebDir = Join-Path $RootDir 'apps\web'
$ApiLog = Join-Path $LogDir 'api-runtime.log'
$ApiErrLog = Join-Path $LogDir 'api-runtime.err.log'
$WebLog = Join-Path $LogDir 'web-runtime.log'
$WebErrLog = Join-Path $LogDir 'web-runtime.err.log'
$ApiPidFile = Join-Path $LogDir 'api-runtime.pid'
$WebPidFile = Join-Path $LogDir 'web-runtime.pid'

function Get-CommandPath([string]$PreferredPath, [string]$FallbackName) {
  if (Test-Path $PreferredPath) {
    return $PreferredPath
  }

  $command = Get-Command $FallbackName -ErrorAction SilentlyContinue
  if ($command) {
    return $command.Source
  }

  throw "$FallbackName not found."
}

function Stop-ManagedProcess([string]$PidFile) {
  if (-not (Test-Path $PidFile)) {
    return
  }

  $pidValue = Get-Content $PidFile -ErrorAction SilentlyContinue
  if ($pidValue -match '^\d+$') {
    $processId = [int]$pidValue
    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue

    for ($attempt = 0; $attempt -lt 10; $attempt++) {
      if (-not (Get-Process -Id $processId -ErrorAction SilentlyContinue)) {
        break
      }

      Start-Sleep -Milliseconds 300
    }
  }

  Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
}

function Remove-FileWithRetry([string]$Path, [int]$Attempts = 10) {
  if (-not (Test-Path $Path)) {
    return
  }

  for ($attempt = 0; $attempt -lt $Attempts; $attempt++) {
    try {
      Remove-Item $Path -Force -ErrorAction Stop
      return
    } catch {
      Start-Sleep -Milliseconds 300
    }
  }

  throw "Could not clear file: $Path"
}

function Wait-ForUrl([string]$Url, [int]$Seconds = 30) {
  for ($attempt = 0; $attempt -lt $Seconds; $attempt++) {
    try {
      $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 3
      if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
        return
      }
    } catch {
      Start-Sleep -Seconds 1
    }
  }

  throw "Timed out waiting for $Url"
}

$NodeExe = Get-CommandPath $NodeExe 'node'
$PnpmCmd = Get-CommandPath $PnpmCmd 'pnpm'

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

PowerShell -ExecutionPolicy Bypass -File '.\scripts\ensure-postgres.ps1'
& $NodeExe '.\scripts\sync-env.mjs'

& $PnpmCmd --filter @ai-gym/shared build
& $PnpmCmd --filter @ai-gym/db build
& $PnpmCmd --filter @ai-gym/api build
& $PnpmCmd --filter @ai-gym/web build

Stop-ManagedProcess $ApiPidFile
Stop-ManagedProcess $WebPidFile

Get-Process node -ErrorAction SilentlyContinue |
  Where-Object {
    $_.Path -like (Join-Path $env:USERPROFILE 'tools\node20\*')
  } |
  Stop-Process -Force -ErrorAction SilentlyContinue

Remove-FileWithRetry $ApiLog
Remove-FileWithRetry $ApiErrLog
Remove-FileWithRetry $WebLog
Remove-FileWithRetry $WebErrLog

$apiProcess = Start-Process `
  -FilePath $NodeExe `
  -ArgumentList 'apps/api/dist/index.js' `
  -WorkingDirectory $RootDir `
  -RedirectStandardOutput $ApiLog `
  -RedirectStandardError $ApiErrLog `
  -PassThru `
  -WindowStyle Hidden

$webProcess = Start-Process `
  -FilePath $PowerShellExe `
  -ArgumentList '-NoProfile', '-Command', "& '.\node_modules\.bin\next.cmd' start -p 3000" `
  -WorkingDirectory $WebDir `
  -RedirectStandardOutput $WebLog `
  -RedirectStandardError $WebErrLog `
  -PassThru `
  -WindowStyle Hidden

Set-Content -Path $ApiPidFile -Value $apiProcess.Id
Set-Content -Path $WebPidFile -Value $webProcess.Id

Wait-ForUrl 'http://localhost:3001/health'
Wait-ForUrl 'http://localhost:3000'
Wait-ForUrl 'http://localhost:3000/admin'

Write-Host 'AI GYM runtime started.'
Write-Host 'Web: http://localhost:3000'
Write-Host 'Admin: http://localhost:3000/admin'
Write-Host 'API: http://localhost:3001'
Write-Host "API log: $ApiLog"
Write-Host "Web log: $WebLog"
