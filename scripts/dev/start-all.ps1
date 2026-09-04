# QalaGo — start full local dev stack (Windows PowerShell)
# Usage from repo root: .\scripts\dev\start-all.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent

function Start-DevWindow {
    param(
        [string]$Title,
        [string]$WorkingDirectory,
        [string]$Command
    )
    Write-Host "Starting $Title..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList @(
        "-NoExit",
        "-Command",
        "Set-Location '$WorkingDirectory'; Write-Host '$Title' -ForegroundColor Green; $Command"
    ) | Out-Null
}

Set-Location $Root

Start-DevWindow "QalaGo API :3002" "$Root\services\catalog-api" "npm run start:dev"
Start-Sleep -Seconds 2
Start-DevWindow "QalaGo AI :3004" "$Root" "npm run dev:ai"
Start-Sleep -Seconds 1
Start-DevWindow "QalaGo Admin :3001" "$Root" "npm run dev:admin"
Start-DevWindow "QalaGo Business :3003" "$Root" "npm run dev:business"
Start-DevWindow "QalaGo Mobile :8080" "$Root\apps\mobile" "flutter run -d web-server --web-port=8080"

Write-Host ""
Write-Host "Dev stack starting in separate windows:" -ForegroundColor Green
Write-Host "  API      http://localhost:3002/api/v1/health"
Write-Host "  Admin    http://localhost:3001"
Write-Host "  Business http://localhost:3003"
Write-Host "  AI       http://localhost:3004/api/v1/health"
Write-Host "  Mobile   http://localhost:8080"
Write-Host ""
Write-Host "Postgres must be running (local or npm run dev:infra)." -ForegroundColor Yellow
