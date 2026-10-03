# L120c's browser specs: the twenty-one the map names for the touched paths (checks-for-paths.txt, `e2e`), two workers on
# port 4574 through a config copy kept under build\l120c-e2e (playwright.l120c.config.ts: the committed config with the
# port, the workers, the output folder and the storage state's origin changed), never port 4173. Detached.
param([string[]]$Only)
$work = (Resolve-Path (Join-Path $PSScriptRoot '..\..\..\..')).Path
$log = Join-Path $work 'build\l120c-checks\e2e.txt'
$exit = Join-Path $work 'docs\prompts\runs\L120c\e2e-exit.txt'
$names = if ($Only) { $Only } else { @('competence', 'engine', 'first-day', 'lab', 'lesson-flow', 'lesson-tools', 'mic', 'modes-ladder', 'modes-rhythm-only', 'modes-technique-measure', 'placement-branches', 'plan', 'score.countin', 'score.latch', 'score.readahead', 'score.rhythm-ladder', 'score.run', 'score.screen', 'side-panel-prose', 'start-and-return', 'today') }
$specs = $names | ForEach-Object { "tests/e2e/$_.spec.ts" }
if ($Only) { $log = Join-Path $work ('build\l120c-checks\e2e-' + ($Only -join '-') + '.txt') }
Set-Location (Join-Path $work 'app')
$missing = $specs | Where-Object { -not (Test-Path $_) }
"missing spec files: $($missing.Count) $($missing -join ' ')" | Out-File -Append -Encoding utf8 $exit
$command = "npx playwright test --config ../build/l120c-e2e/playwright.l120c.config.ts " + ($specs -join ' ')
$command | Out-File -Encoding utf8 $log
cmd /c "$command >> `"$log`" 2>&1"
"e2e ($($names -join ', ')) exit=$LASTEXITCODE" | Out-File -Append -Encoding utf8 $exit
