Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

param(
  [string]$RepoPath = (Resolve-Path "$PSScriptRoot/..").Path,
  [string]$StartTaskName = 'ZXOP-StartSystem',
  [string]$DeployTaskName = 'ZXOP-AutoDeploy',
  [switch]$OnlyStartTask
)

$startScript = (Resolve-Path "$RepoPath/ops/start-system.ps1").Path
$deployScript = (Resolve-Path "$RepoPath/ops/deploy.ps1").Path

$startAction = "powershell.exe -NoProfile -ExecutionPolicy Bypass -File `"$startScript`""
$deployAction = "powershell.exe -NoProfile -ExecutionPolicy Bypass -File `"$deployScript`""

Write-Host "[tasks] Installing startup task: $StartTaskName"
schtasks /Create /TN $StartTaskName /SC ONSTART /TR $startAction /RL HIGHEST /F | Out-Null
if ($LASTEXITCODE -ne 0) {
  throw 'Failed to create startup task'
}

if (-not $OnlyStartTask) {
  Write-Host "[tasks] Installing deploy polling task: $DeployTaskName"
  schtasks /Create /TN $DeployTaskName /SC MINUTE /MO 1 /TR $deployAction /RL HIGHEST /F | Out-Null
  if ($LASTEXITCODE -ne 0) {
    throw 'Failed to create deploy task'
  }
}

Write-Host '[tasks] Tasks installed successfully.'
