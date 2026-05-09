$ErrorActionPreference = 'Stop'

$ports = @(3000, 5000)

foreach ($port in $ports) {
    $connections = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if (-not $connections) {
        Write-Host "Port $port is not listening." -ForegroundColor Yellow
        continue
    }

    $processIds = $connections | Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($processId in $processIds) {
        try {
            Stop-Process -Id $processId -Force -ErrorAction Stop
            Write-Host "Stopped PID $processId on port $port." -ForegroundColor Green
        } catch {
            Write-Host ("Failed to stop PID {0} on port {1}: {2}" -f $processId, $port, $_.Exception.Message) -ForegroundColor Red
        }
    }
}