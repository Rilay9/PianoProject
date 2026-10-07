param([string]$Tag)
# U118b's state gallery on whatever is in dist/, from app/; keeps states.json under build/u118b/.
$ErrorActionPreference = 'Continue'
Set-Location (Join-Path $PSScriptRoot '..\..')
$exitFile = "build/u118b/gallery-$Tag.exit"
if (Test-Path $exitFile) { Remove-Item $exitFile }
& npx playwright test --config build/u118b/playwright.states.u118b-5343.config.ts *> "build/u118b/gallery-$Tag.log"
$code = $LASTEXITCODE
Copy-Item ../build/states/states.json "build/u118b/gallery-$Tag-states.json" -ErrorAction SilentlyContinue
"exit $code" | Out-File -Encoding utf8 $exitFile
