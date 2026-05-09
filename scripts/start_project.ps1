$ErrorActionPreference = 'Stop'

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Split-Path -Parent $scriptRoot
$backendPython = Join-Path $repoRoot '.venv\Scripts\python.exe'
$backendApp = Join-Path $repoRoot 'backend\app.py'
$frontendDir = Join-Path $repoRoot 'frontend'

function Test-PortListening {
    param([int]$Port)

    return $null -ne (Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1)
}

function Start-ServiceProcess {
    param(
        [string]$FilePath,
        [string[]]$ArgumentList,
        [string]$WorkingDirectory
    )

    Start-Process -FilePath $FilePath -ArgumentList $ArgumentList -WorkingDirectory $WorkingDirectory | Out-Null
}

if (-not (Test-Path $backendPython)) {
    Write-Error "Missing virtual environment interpreter: $backendPython"
}

if (-not (Test-Path $backendApp)) {
    Write-Error "Missing backend entry file: $backendApp"
}

if (-not (Test-Path $frontendDir)) {
    Write-Error "Missing frontend directory: $frontendDir"
}

$npmCommand = Get-Command npm.cmd -ErrorAction SilentlyContinue
if (-not $npmCommand) {
    $npmCommand = Get-Command npm -ErrorAction SilentlyContinue
}

if (-not $npmCommand) {
    Write-Error 'npm executable was not found.'
}

if (Test-PortListening -Port 5000) {
    Write-Host 'Backend is already running on http://localhost:5000' -ForegroundColor Yellow
} else {
    Start-ServiceProcess `
        -FilePath $backendPython `
        -ArgumentList @($backendApp) `
        -WorkingDirectory $repoRoot
    Write-Host 'Backend launch command sent.' -ForegroundColor Green
}

if (Test-PortListening -Port 3000) {
    Write-Host 'Frontend is already running on http://localhost:3000' -ForegroundColor Yellow
} else {
    Start-ServiceProcess `
        -FilePath $npmCommand.Source `
        -ArgumentList @('start') `
        -WorkingDirectory $frontendDir
    Write-Host 'Frontend launch command sent.' -ForegroundColor Green
}

Write-Host ''
Write-Host 'Expected URLs:' -ForegroundColor Cyan
Write-Host '  Frontend: http://localhost:3000'
Write-Host '  Backend:  http://localhost:5000/api/health'