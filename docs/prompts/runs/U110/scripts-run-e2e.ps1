# U110: runs a Playwright config detached (Git Bash background shells end at ten minutes).
# Usage: powershell -File run-e2e.ps1 -Config <config under app/> -Log <log name> [-Workers 2] [-Specs "a b c"]
param([string]$Config, [string]$Log, [int]$Workers = 2, [string]$Specs = '')
$app = Join-Path $PSScriptRoot '..\app'
Set-Location $app
$logPath = Join-Path $PSScriptRoot $Log
$list = @()
if ($Specs -ne '') { $list = $Specs.Split(' ') }
& npx playwright test --config $Config @list --workers=$Workers *> $logPath
$code = $LASTEXITCODE
Set-Content -Path (Join-Path $PSScriptRoot "$Log.exit") -Value $code -Encoding ascii
