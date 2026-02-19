Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

param(
  [string]$ApiUrl = 'http://127.0.0.1:3000/api/health',
  [string]$UiUrl = 'http://127.0.0.1:4173/',
  [int]$Retries = 10,
  [int]$DelaySeconds = 3
)

function Test-Endpoint {
  param(
    [Parameter(Mandatory = $true)][string]$Url,
    [Parameter(Mandatory = $true)][string]$Name
  )

  for ($attempt = 1; $attempt -le $Retries; $attempt++) {
    try {
      $response = Invoke-WebRequest -Uri $Url -Method Get -TimeoutSec 8
      if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 400) {
        Write-Host "[health] $Name OK ($($response.StatusCode))"
        return $true
      }
    }
    catch {
      Write-Host "[health] $Name attempt $attempt/$Retries failed: $($_.Exception.Message)"
    }

    Start-Sleep -Seconds $DelaySeconds
  }

  return $false
}

$apiOk = Test-Endpoint -Url $ApiUrl -Name 'API'
$uiOk = Test-Endpoint -Url $UiUrl -Name 'UI'

if (-not ($apiOk -and $uiOk)) {
  throw "Healthcheck failed. API=$apiOk UI=$uiOk"
}

Write-Host '[health] All checks passed.'
