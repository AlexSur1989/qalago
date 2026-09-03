# QalaGo — Docker staging one-shot setup (Windows PowerShell)
# Usage from repo root: .\scripts\dev\staging.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
Set-Location $Root

function Test-Docker {
    try {
        docker info 2>$null | Out-Null
        return $LASTEXITCODE -eq 0
    } catch {
        return $false
    }
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "Docker CLI not found. Install Docker Desktop:" -ForegroundColor Yellow
    Write-Host "  winget install -e --id Docker.DockerDesktop"
    Write-Host "Then restart terminal, start Docker Desktop, and run this script again."
    exit 1
}

if (-not (Test-Docker)) {
    Write-Host "Docker is installed but not running. Start Docker Desktop and retry." -ForegroundColor Yellow
    exit 1
}

$portInUse = Get-NetTCPConnection -LocalPort 3002 -State Listen -ErrorAction SilentlyContinue
if ($portInUse) {
    Write-Host "Port 3002 is already in use (local dev API?). Stop it before staging:" -ForegroundColor Yellow
    Write-Host "  Stop catalog-api dev server, then rerun this script."
    exit 1
}

Write-Host "Starting staging containers..." -ForegroundColor Cyan
npm run staging:up
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Waiting for API health..." -ForegroundColor Cyan
$ok = $false
for ($i = 0; $i -lt 30; $i++) {
    try {
        $r = Invoke-RestMethod -Uri "http://localhost:3002/api/v1/health" -TimeoutSec 3
        if ($r.status -eq "ok" -or $r.ok -eq $true -or $r) {
            $ok = $true
            break
        }
    } catch { Start-Sleep -Seconds 2 }
}
if (-not $ok) {
    Write-Host "API not healthy yet. Try: npm run staging:seed" -ForegroundColor Yellow
} else {
    Write-Host "API healthy at http://localhost:3002/api/v1/health" -ForegroundColor Green
}

Write-Host "Seeding database (first run or schema change)..." -ForegroundColor Cyan
npm run staging:seed

Write-Host "Done. Staging API: http://localhost:3002/api/v1/health" -ForegroundColor Green
