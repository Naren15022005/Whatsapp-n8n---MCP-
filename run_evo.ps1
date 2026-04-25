$EVO_KEY="6a2e4d3fdab11748db011e1cf26a2164c8e64cb1440f7e3b"
$headers = @{ "apikey" = $EVO_KEY }
if (-not (Test-Path "./evolution")) { New-Item -ItemType Directory -Path "./evolution" }
try {
    $create = Invoke-RestMethod -Uri "http://localhost:8080/instance/create" -Method Post -Headers $headers -Body (ConvertTo-Json @{ instanceName = "bot-ventas"; qrcode = $true }) -ContentType "application/json"
    Write-Output "CREATE_SUCCESS"
} catch { Write-Output "CREATE_ERROR: $($_.Status)" }
try {
    $status = Invoke-RestMethod -Uri "http://localhost:8080/instance/connect/bot-ventas" -Method Get -Headers $headers
    if ($status.base64) {
        $base64String = $status.base64 -replace "^data:image\/\w+;base64,", ""
        $bytes = [System.Convert]::FromBase64String($base64String)
        [System.IO.File]::WriteAllBytes("$PWD/evolution/bot-ventas-qr.png", $bytes)
        Write-Output "QR_SAVED"
    }
    $status | ConvertTo-Json
} catch { Write-Output "STATUS_ERROR" }
