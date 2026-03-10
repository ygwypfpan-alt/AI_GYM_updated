$ErrorActionPreference = "Stop"

Set-Location (Resolve-Path "$PSScriptRoot\..")

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

if (-not (Test-Path ".env")) {
  Write-Host ".env not found. Copying from .env.example..."
  Copy-Item ".env.example" ".env"
}

Invoke-Step "Ensuring PostgreSQL is running..." { PowerShell -ExecutionPolicy Bypass -File .\scripts\ensure-postgres.ps1 }
Invoke-Step "Syncing env files..." { node .\scripts\sync-env.mjs }

Write-Host "Stopping existing Node processes to avoid Prisma file locks..."
cmd /c "taskkill /F /IM node.exe >nul 2>nul"

$env:CI = "true"
Invoke-Step "Installing dependencies..." { pnpm install }
Invoke-Step "Generating Prisma client..." { pnpm --filter @ai-gym/db prisma:generate }
Invoke-Step "Running database migration..." { pnpm --filter @ai-gym/db exec prisma migrate deploy }
Invoke-Step "Seeding database..." { pnpm --filter @ai-gym/db prisma:seed }

Write-Host ""
Write-Host "Setup completed."
Write-Host "Next steps:"
Write-Host "1. Start dev servers: PowerShell -ExecutionPolicy Bypass -File .\scripts\dev.ps1"
Write-Host "2. Open web: http://localhost:3000"
Write-Host "3. Open admin: http://localhost:3000/admin"
Write-Host "4. Check API health: http://localhost:3001/health"
