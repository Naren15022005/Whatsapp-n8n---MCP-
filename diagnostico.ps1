$apikey = '6a2e4d3fdab11748db011e1cf26a2164c8e64cb1440f7e3b'

Write-Host "`n=== Diagnóstico Evolution API ===" -ForegroundColor Cyan

# 1. Estado de contenedores
Write-Host "`n1. Estado de contenedores:" -ForegroundColor Yellow
docker-compose ps

# 2. DNS desde el contenedor
Write-Host "`n2. DNS desde contenedor (nslookup web.whatsapp.com):" -ForegroundColor Yellow
try { docker exec whatsapp-n8n---mcp--evolution-api-1 nslookup web.whatsapp.com 2>&1 | Write-Output } catch { Write-Output "nslookup no disponible: $($_.Exception.Message)" }

# 3. Conectividad a WhatsApp
Write-Host "`n3. Conectividad a WhatsApp (curl -I https://web.whatsapp.com):" -ForegroundColor Yellow
try { docker exec whatsapp-n8n---mcp--evolution-api-1 curl -Is --max-time 10 https://web.whatsapp.com 2>&1 | Select-Object -First 5 | Write-Output } catch { Write-Output "curl no disponible: $($_.Exception.Message)" }

# 4. Logs recientes
Write-Host "`n4. Logs de Evolution API (últimas 30 líneas, filtrados):" -ForegroundColor Yellow
docker-compose logs evolution-api --tail=100 | Select-String 'HTTP - ON|redis ready|Instance REMOVED|WebSocket|error|ERROR|Browser|qrcode|QR|P1001' | ForEach-Object { $_.Line }

# 5. Instancias existentes
Write-Host "`n5. Instancias existentes:" -ForegroundColor Yellow
try {
    $inst = Invoke-WebRequest -Uri "http://localhost:8080/instance/fetchInstances" -Headers @{"apikey"=$apikey} -Method GET -TimeoutSec 10 -ErrorAction Stop
    $inst.Content | ConvertFrom-Json | Select-Object name, connectionStatus, number | Format-Table
} catch { Write-Output "FetchInstances failed: $($_.Exception.Message)" }

Write-Host "`n=== Fin del diagnóstico ===" -ForegroundColor Cyan
