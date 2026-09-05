# QalaGo — restart full local dev stack (Windows PowerShell)
# Usage from repo root: .\scripts\dev\restart-all.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$Ports = @(3001, 3002, 3003, 3004, 8080)

function Stop-PortListeners {
    param([int[]]$PortList)
    foreach ($port in $PortList) {
        $connections = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
        foreach ($conn in $connections) {
            $processId = $conn.OwningProcess
            if ($processId -and $processId -ne 0) {
                Write-Host "Stopping PID $processId on port $port..." -ForegroundColor Yellow
                Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
            }
        }
    }
    Start-Sleep -Seconds 2
}

Write-Host "Restarting QalaGo dev stack..." -ForegroundColor Cyan
Stop-PortListeners -PortList $Ports

Set-Location $Root
& "$Root\scripts\dev\start-all.ps1"
