Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

param(
  [string]$ComposeFile = 'docker-compose.yml',
  [string]$ApiImage = 'zx-op-api:local',
  [string]$ApiPrevImage = 'zx-op-api:prev',
  [string]$UiImage = 'zx-op-ui:local',
  [string]$UiPrevImage = 'zx-op-ui:prev'
)

function Restore-ImageTag {
  param(
    [Parameter(Mandatory = $true)][string]$SourceTag,
    [Parameter(Mandatory = $true)][string]$TargetTag
  )

  docker image inspect $SourceTag *> $null
  if ($LASTEXITCODE -ne 0) {
    throw "Rollback source image not found: $SourceTag"
  }

  docker image tag $SourceTag $TargetTag
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to retag image from $SourceTag to $TargetTag"
  }
}

Restore-ImageTag -SourceTag $ApiPrevImage -TargetTag $ApiImage
Restore-ImageTag -SourceTag $UiPrevImage -TargetTag $UiImage

docker compose -f $ComposeFile up -d --no-build postgres api ui
if ($LASTEXITCODE -ne 0) {
  throw 'docker compose up failed during rollback'
}

Write-Host '[rollback] Rollback completed and services restarted.'
