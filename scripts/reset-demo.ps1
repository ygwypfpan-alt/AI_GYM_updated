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

Invoke-Step "Ensuring PostgreSQL is running..." { PowerShell -ExecutionPolicy Bypass -File .\scripts\ensure-postgres.ps1 }
Invoke-Step "Syncing env files..." { node .\scripts\sync-env.mjs }
Invoke-Step "Applying database migrations..." { pnpm --filter @ai-gym/db exec prisma migrate deploy }
Invoke-Step "Resetting demo seed data..." { pnpm --filter @ai-gym/db prisma:seed }

Write-Host ""
Write-Host "Demo / customer-test data reset completed."
Write-Host "Seeded lookup user: 0911111111 / ming@example.com"
Write-Host "Seeded admin user: admin / admin123456"
Write-Host "Sample booking states: upcoming booked, cancelled, completed"
