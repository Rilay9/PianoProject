param([string]$Prefix, [int]$Times, [string]$Grep, [string]$Arms)
# U118b: one grid cell run $Times times on whatever is in dist/, one Playwright run at a time, from app/.
# Each run writes build/u118b/grid-<Prefix><n>/; the exit codes go to build/u118b/<Prefix>.exit.
$ErrorActionPreference = 'Continue'
Set-Location (Join-Path $PSScriptRoot '..\..')
$env:U118B_TESTDIR = 'build/u118b/probe'
$env:U118B_ARMS = $Arms
$env:U118B_SET = ''
$exitFile = "build/u118b/$Prefix.exit"
if (Test-Path $exitFile) { Remove-Item $exitFile }
$codes = @()
for ($n = 1; $n -le $Times; $n++) {
  $env:U118B_TAG = "$Prefix$n"
  & npx playwright test --config build/u118b/playwright.u118b-5343.config.ts grid.spec.ts -g $Grep *> "build/u118b/$Prefix$n.log"
  $codes += $LASTEXITCODE
}
($codes -join ' ') | Out-File -Encoding utf8 $exitFile
