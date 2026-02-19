Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

param(
  [string]$StartTaskName = 'ZXOP-StartSystem',
  [string]$DeployTaskName = 'ZXOP-AutoDeploy'
)

schtasks /Delete /TN $StartTaskName /F *> $null
schtasks /Delete /TN $DeployTaskName /F *> $null

Write-Host '[tasks] Autostart tasks removed (if they existed).'
