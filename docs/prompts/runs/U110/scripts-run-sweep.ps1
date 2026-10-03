# U110: runs the probe sweep detached (Git Bash background shells end at ten minutes).
# Usage: powershell -File run-sweep.ps1 <out folder under app/> <grep> <log name>
param([string]$Out, [string]$Grep, [string]$Log)
$app = Join-Path $PSScriptRoot '..\app'
Set-Location $app
$env:U110_PROBES = '1'
$env:U110_OUT = $Out
$logPath = Join-Path $PSScriptRoot $Log
& npx playwright test --config build/u110/playwright.u110-5423.config.ts u110-sweep -g $Grep *> $logPath
$code = $LASTEXITCODE
Set-Content -Path (Join-Path $PSScriptRoot "$Log.exit") -Value $code -Encoding ascii
