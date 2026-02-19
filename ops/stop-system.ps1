Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

param(
  [string]$RepoPath = (Resolve-Path "$PSScriptRoot/..").Path,
  [string]$ComposeFile = 'docker-compose.yml'
)

Write-Host '[stop] Stopping Zona Xtreme stack...'
Set-Location $RepoPath

docker compose -f $ComposeFile down
if ($LASTEXITCODE -ne 0) {
  throw 'docker compose down failed'
}

Write-Host '[stop] Stack stopped.'
