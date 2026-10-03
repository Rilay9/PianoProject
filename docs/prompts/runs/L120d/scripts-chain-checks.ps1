# L120d's checks after the re-run (the map's minimum, checks-for-paths.txt, less the content build, which the after
# re-run is): the validator, the record check, the whole content suite, the committed-reports test with the regenerated
# reports in place (then restored), the typecheck, the lint, the whole unit suite on the rebuilt content, the app build,
# then the browser specs the map names at two workers on port 4874 through the config copy under app\build\l120d (never
# port 4173; nothing else runs meanwhile). One at a time, detached; each log under build\l120d-checks, each exit code in
# chain-checks-exit.txt.
$work = (Resolve-Path (Join-Path $PSScriptRoot '..\..\..\..')).Path
$logs = Join-Path $work 'build\l120d-checks'
New-Item -ItemType Directory -Force $logs | Out-Null
Remove-Item -Force -ErrorAction SilentlyContinue (Join-Path $logs 'chain-done.txt')
$exit = Join-Path $work 'docs\prompts\runs\L120d\chain-checks-exit.txt'
"L120d chain checks, one at a time" | Out-File -Encoding utf8 $exit
$content = Join-Path $work 'app\public\content'
function Step([string]$name, [string]$dir, [string]$command) {
  Set-Location (Join-Path $work $dir)
  $log = Join-Path $logs "$name.txt"
  $command | Out-File -Encoding utf8 $log
  cmd /c "$command >> `"$log`" 2>&1"
  "$name exit=$LASTEXITCODE" | Out-File -Append -Encoding utf8 $exit
}
Step 'content-validate' '.' "python tools\content\validate.py --dir `"$content`" --allow-nc --personal"
Step 'review-check' '.' 'python tools\content\review.py --check'
Step 'content-tests' '.' 'python -m unittest discover -s tools/content/tests -t tools/content'
# The committed-reports test with the after build's regenerated rung-claims.md and inventory.md in place, then restored.
$snap = Join-Path $work 'build\l120d-snapshot'
$kept = Join-Path $work 'build\l120d-after'
Copy-Item (Join-Path $kept 'rung-claims.md') (Join-Path $work 'docs\prompts\rung-claims.md') -Force
Copy-Item (Join-Path $kept 'inventory.md') (Join-Path $work 'docs\prompts\inventory.md') -Force
Step 'reports-with-regenerated' 'tools\content' 'python -m unittest tests.test_measured_truth.TestTheReports'
Copy-Item (Join-Path $snap 'rung-claims.md') (Join-Path $work 'docs\prompts\rung-claims.md') -Force
Copy-Item (Join-Path $snap 'inventory.md') (Join-Path $work 'docs\prompts\inventory.md') -Force
Step 'tsc' 'app' 'npx tsc -b --noEmit'
Step 'lint' 'app' 'npm run lint'
Step 'unit' 'app' 'npx vitest run'
Step 'build-app' 'app' 'npm run build:app'
$names = @('competence', 'lesson-tools', 'placement-branches', 'plan', 'start-and-return', 'today', 'transfer-offer')
$specs = $names | ForEach-Object { "tests/e2e/$_.spec.ts" }
Set-Location (Join-Path $work 'app')
$missing = @($specs | Where-Object { -not (Test-Path $_) })
"e2e spec files missing: $($missing.Count) $($missing -join ' ')" | Out-File -Append -Encoding utf8 $exit
Step 'e2e' 'app' ("npx playwright test --config build/l120d/playwright.l120d.config.ts " + ($specs -join ' '))
Set-Location $work
cmd /c "git status --short >> `"$exit`" 2>&1"
"done" | Out-File -Encoding utf8 (Join-Path $logs 'chain-done.txt')
