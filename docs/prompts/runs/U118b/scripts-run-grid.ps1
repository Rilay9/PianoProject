param([string]$Tag, [string]$Arms)
# U118b's grid, both sets in turn, from app/. Writes logs and an exit file under build/u118b/.
$ErrorActionPreference = 'Continue'
Set-Location (Join-Path $PSScriptRoot '..\..')
$env:U118B_TESTDIR = 'build/u118b/probe'
$env:U118B_TAG = $Tag
$env:U118B_ARMS = $Arms
$exitFile = "build/u118b/grid-$Tag.exit"
if (Test-Path $exitFile) { Remove-Item $exitFile }
$env:U118B_SET = ''
& npx playwright test --config build/u118b/playwright.u118b-5343.config.ts grid.spec.ts *> "build/u118b/grid-$Tag-upright.log"
$upright = $LASTEXITCODE
$env:U118B_SET = 'not-tablets'
& npx playwright test --config build/u118b/playwright.u118b-5343.config.ts grid.spec.ts *> "build/u118b/grid-$Tag-not-tablets.log"
$large = $LASTEXITCODE
"upright $upright`nnot-tablets $large" | Out-File -Encoding utf8 $exitFile
