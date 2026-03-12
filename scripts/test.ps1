$ErrorActionPreference = 'Stop'

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir
Set-Location $RootDir

function Invoke-Step {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Message,
    [Parameter(Mandatory = $true)]
    [scriptblock]$Action
  )

  Write-Host $Message
  & $Action

  if ($LASTEXITCODE -ne 0) {
    throw "Step failed: $Message"
  }
}

Invoke-Step "Resetting demo data..." { pnpm demo:reset }
Invoke-Step "Running internal smoke tests..." { pnpm test }
