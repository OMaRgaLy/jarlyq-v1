# Перезапуск локального бэкенда Jarlyq (порт 8080).
# Запуск из корня проекта:  powershell -ExecutionPolicy Bypass -File .\restart-backend.ps1

$port = 8080
$conn = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
if ($conn) {
    Write-Host "Останавливаю процесс на порту $port (PID $($conn.OwningProcess))..."
    Stop-Process -Id $conn.OwningProcess -Force
    Start-Sleep -Seconds 1
}

Write-Host "Запускаю бэкенд..."
Set-Location "$PSScriptRoot\backend"
go run ./cmd/api
