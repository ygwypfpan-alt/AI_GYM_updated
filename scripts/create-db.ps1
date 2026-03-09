param(
  [string]$DbName = 'ai_gym',
  [string]$UserName = 'postgres',
  [string]$HostName = 'localhost',
  [int]$Port = 5432
)

$ErrorActionPreference = 'Stop'

if (-not (Get-Command psql -ErrorAction SilentlyContinue)) {
  Write-Host '找不到 psql。請先安裝 PostgreSQL 並把 psql 加到 PATH。' -ForegroundColor Yellow
  exit 1
}

$exists = & psql -U $UserName -h $HostName -p $Port -tAc "SELECT 1 FROM pg_database WHERE datname = '$DbName';"

if ($exists -eq '1') {
  Write-Host "資料庫 $DbName 已存在。" -ForegroundColor Green
  exit 0
}

& psql -U $UserName -h $HostName -p $Port -c "CREATE DATABASE $DbName;"
Write-Host "已建立資料庫 $DbName。" -ForegroundColor Green
