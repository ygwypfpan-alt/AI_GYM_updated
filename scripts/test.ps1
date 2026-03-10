$ErrorActionPreference = 'Stop'

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir
Set-Location $RootDir

PowerShell -ExecutionPolicy Bypass -File '.\scripts\ensure-postgres.ps1'
node '.\scripts\sync-env.mjs'
pnpm test
