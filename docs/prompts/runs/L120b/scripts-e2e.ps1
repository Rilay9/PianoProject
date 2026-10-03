# L120b's browser specs: the sixteen the map names for the touched paths (checks-for-paths.txt, `e2e`), two
# workers on port 4474 through a config copy in the gitignored app\.probe (playwright.l120b.config.ts: the
# committed config with the port, the workers and the output folder changed), never port 4173. Detached.
$work = (Resolve-Path (Join-Path $PSScriptRoot '..\..\..\..')).Path
$log = Join-Path $work 'build\l120b-checks\e2e.txt'
$exit = Join-Path $work 'docs\prompts\runs\L120b\e2e-exit.txt'
$specs = @('competence', 'first-day', 'lab', 'lesson-flow', 'lesson-tools', 'modes-ladder', 'modes-placement', 'placement-branches', 'plan', 'progress', 'score-fit-paths', 'score.ladder-route', 'session-run', 'start-and-return', 'today', 'transfer-offer') | ForEach-Object { "tests/e2e/$_.spec.ts" }
Set-Location (Join-Path $work 'app')
$missing = $specs | Where-Object { -not (Test-Path $_) }
"missing spec files: $($missing.Count)" | Out-File -Encoding utf8 $exit
$command = "npx playwright test --config .probe/playwright.l120b.config.ts " + ($specs -join ' ')
$command | Out-File -Encoding utf8 $log
cmd /c "$command >> `"$log`" 2>&1"
"e2e exit=$LASTEXITCODE" | Out-File -Append -Encoding utf8 $exit
