$ErrorActionPreference = 'Stop'

$PgRoot = Join-Path $env:USERPROFILE 'tools\postgresql18'
$PgBin = Join-Path $PgRoot 'bin'
$PgData = Join-Path $PgRoot 'data'
$PgLog = Join-Path $PgRoot 'postgres.log'
$PgIsReady = Join-Path $PgBin 'pg_isready.exe'
$PgCtl = Join-Path $PgBin 'pg_ctl.exe'

function Test-PostgresReady {
  if (-not (Test-Path $PgIsReady)) {
    return $false
  }

  & $PgIsReady -h localhost -p 5432 *> $null
  return $LASTEXITCODE -eq 0
}

if (Test-PostgresReady) {
  Write-Host 'PostgreSQL is already accepting connections.'
  exit 0
}

if (-not (Test-Path $PgCtl) -or -not (Test-Path $PgData)) {
  throw 'PostgreSQL is not running and no local bundled PostgreSQL installation was found.'
}

Write-Host 'Starting local PostgreSQL...'
cmd /c "`"$PgCtl`" -D `"$PgData`" -l `"$PgLog`" start >nul 2>nul"

for ($attempt = 0; $attempt -lt 10; $attempt++) {
  Start-Sleep -Milliseconds 500

  if (Test-PostgresReady) {
    Write-Host 'PostgreSQL is ready.'
    exit 0
  }
}

throw 'PostgreSQL did not become ready in time.'
