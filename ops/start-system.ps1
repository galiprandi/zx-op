Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

param(
  [string]$RepoPath = (Resolve-Path "$PSScriptRoot/..").Path,
  [string]$ComposeFile = 'docker-compose.yml',
  [switch]$SkipBuild
)

Write-Host '[start] Starting Zona Xtreme stack...'
Set-Location $RepoPath

function Assert-Command {
  param([Parameter(Mandatory = $true)][string]$Name)

  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Required command not found: $Name"
  }
}

Assert-Command -Name 'docker'

if (-not (Test-Path (Join-Path $RepoPath $ComposeFile))) {
  throw "Compose file not found: $ComposeFile"
}

if (-not $SkipBuild) {
  Write-Host '[start] Building API and UI images...'
  docker compose -f $ComposeFile build api ui
  if ($LASTEXITCODE -ne 0) {
    throw 'docker compose build failed'
  }
}

Write-Host '[start] Starting postgres...'
docker compose -f $ComposeFile up -d postgres
if ($LASTEXITCODE -ne 0) {
  throw 'docker compose up postgres failed'
}

Write-Host '[start] Running prisma generate...'
docker compose -f $ComposeFile run --rm api pnpm --filter api db:generate
if ($LASTEXITCODE -ne 0) {
  throw 'prisma generate failed'
}

Write-Host '[start] Running production migrations...'
docker compose -f $ComposeFile run --rm api pnpm --filter api exec prisma migrate deploy
if ($LASTEXITCODE -ne 0) {
  throw 'prisma migrate deploy failed'
}

Write-Host '[start] Starting API and UI...'
docker compose -f $ComposeFile up -d api ui
if ($LASTEXITCODE -ne 0) {
  throw 'docker compose up api ui failed'
}

Write-Host '[start] Running health checks...'
& "$RepoPath/ops/healthcheck.ps1"

Write-Host '[start] Stack is up and healthy.'
