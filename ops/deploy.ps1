Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

param(
  [string]$RepoPath = (Resolve-Path "$PSScriptRoot/..").Path,
  [string]$ComposeFile = 'docker-compose.yml',
  [string]$Branch = 'main',
  [string]$Remote = 'lan-origin',
  [string]$ApiImage = 'zx-op-api:local',
  [string]$ApiPrevImage = 'zx-op-api:prev',
  [string]$UiImage = 'zx-op-ui:local',
  [string]$UiPrevImage = 'zx-op-ui:prev',
  [string]$ApiHealthUrl = 'http://127.0.0.1:3000/api/health',
  [string]$UiHealthUrl = 'http://127.0.0.1:4173/'
)

$lockPath = Join-Path $RepoPath 'ops/deploy.lock'
$logsDir = Join-Path $RepoPath 'ops/logs'
$logFile = Join-Path $logsDir 'deploy.log'

if (-not (Test-Path $logsDir)) {
  New-Item -ItemType Directory -Path $logsDir -Force | Out-Null
}

function Write-Log {
  param([Parameter(Mandatory = $true)][string]$Message)

  $line = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') $Message"
  $line | Tee-Object -FilePath $logFile -Append
}

function Save-PreviousTag {
  param(
    [Parameter(Mandatory = $true)][string]$CurrentTag,
    [Parameter(Mandatory = $true)][string]$PrevTag
  )

  docker image inspect $CurrentTag *> $null
  if ($LASTEXITCODE -eq 0) {
    docker image tag $CurrentTag $PrevTag
    if ($LASTEXITCODE -ne 0) {
      throw "Failed to create rollback tag $PrevTag"
    }
  }
}

function Wait-PostgresReady {
  param(
    [Parameter(Mandatory = $true)][int]$MaxAttempts
  )

  for ($attempt = 1; $attempt -le $MaxAttempts; $attempt++) {
    $status = (docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' zx-op-postgres 2>$null)

    if ($status -eq 'healthy' -or $status -eq 'running') {
      return
    }

    if ($attempt -eq $MaxAttempts) {
      throw "postgres did not become ready in time (last status: $status)"
    }

    Start-Sleep -Seconds 2
  }
}

$lockHandle = $null
$deployStart = Get-Date

try {
  $lockHandle = [System.IO.File]::Open($lockPath, [System.IO.FileMode]::OpenOrCreate, [System.IO.FileAccess]::ReadWrite, [System.IO.FileShare]::None)

  Set-Location $RepoPath

  Write-Log '[deploy] Starting deployment cycle.'

  git fetch $Remote $Branch
  if ($LASTEXITCODE -ne 0) {
    throw "git fetch failed for $Remote/$Branch"
  }

  $localSha = (git rev-parse HEAD).Trim()
  $remoteSha = (git rev-parse "$Remote/$Branch").Trim()

  if ($localSha -eq $remoteSha) {
    Write-Log "[deploy] No changes detected. HEAD=$localSha"
    exit 0
  }

  Write-Log "[deploy] New commit detected. local=$localSha remote=$remoteSha"

  git pull --ff-only $Remote $Branch
  if ($LASTEXITCODE -ne 0) {
    throw 'git pull --ff-only failed'
  }

  Save-PreviousTag -CurrentTag $ApiImage -PrevTag $ApiPrevImage
  Save-PreviousTag -CurrentTag $UiImage -PrevTag $UiPrevImage

  docker compose -f $ComposeFile build api ui
  if ($LASTEXITCODE -ne 0) {
    throw 'docker compose build failed'
  }

  docker compose -f $ComposeFile up -d postgres
  if ($LASTEXITCODE -ne 0) {
    throw 'failed to ensure postgres is running'
  }

  Wait-PostgresReady -MaxAttempts 30

  docker compose -f $ComposeFile run --rm api pnpm --filter api db:generate
  if ($LASTEXITCODE -ne 0) {
    throw 'prisma generate failed'
  }

  docker compose -f $ComposeFile run --rm api pnpm --filter api exec prisma migrate deploy
  if ($LASTEXITCODE -ne 0) {
    throw 'database migration failed'
  }

  docker compose -f $ComposeFile up -d api ui
  if ($LASTEXITCODE -ne 0) {
    throw 'docker compose up failed'
  }

  & "$RepoPath/ops/healthcheck.ps1" -ApiUrl $ApiHealthUrl -UiUrl $UiHealthUrl

  $deployedSha = (git rev-parse HEAD).Trim()
  $duration = [Math]::Round(((Get-Date) - $deployStart).TotalSeconds, 2)
  Write-Log "[deploy] SUCCESS sha=$deployedSha duration_seconds=$duration"
}
catch {
  $duration = [Math]::Round(((Get-Date) - $deployStart).TotalSeconds, 2)
  Write-Log "[deploy] ERROR duration_seconds=$duration message=$($_.Exception.Message)"

  try {
    Write-Log '[deploy] Attempting rollback.'
    & "$RepoPath/ops/rollback.ps1" -ComposeFile $ComposeFile -ApiImage $ApiImage -ApiPrevImage $ApiPrevImage -UiImage $UiImage -UiPrevImage $UiPrevImage
    & "$RepoPath/ops/healthcheck.ps1" -ApiUrl $ApiHealthUrl -UiUrl $UiHealthUrl
    Write-Log '[deploy] Rollback completed successfully.'
  }
  catch {
    Write-Log "[deploy] Rollback failed: $($_.Exception.Message)"
  }

  exit 1
}
finally {
  if ($null -ne $lockHandle) {
    $lockHandle.Dispose()
  }
}
