# G1e ruling: the long runs, detached and in turn (one heavy run at a time): the whole unit suite (vitest-full.txt,
# vitest-full.exit), then the map's eighteen browser specs for the changed paths on port 4443, two workers, this
# tree's build (e2e-map-4443.txt, e2e-map-4443.exit), then chain.exit. Run from anywhere: paths are this script's own.
$runs = Split-Path -Parent $MyInvocation.MyCommand.Path
$worktree = Resolve-Path (Join-Path $runs '..\..\..\..\..')
$app = Join-Path $worktree 'app'
foreach ($f in @('vitest-full.exit', 'e2e-map-4443.exit', 'chain.exit')) { $p = Join-Path $runs $f; if (Test-Path $p) { Remove-Item $p -Confirm:$false } }

Set-Location $app
$log = Join-Path $runs 'vitest-full.txt'
cmd /c "npx vitest run > `"$log`" 2>&1"
$code = $LASTEXITCODE
Add-Content -Path $log -Value "exit=$code" -Encoding utf8
Set-Content -Path (Join-Path $runs 'vitest-full.exit') -Value "$code" -Encoding utf8

$specs = @(
  'tests/e2e/app-shell.spec.ts', 'tests/e2e/empty-states.spec.ts', 'tests/e2e/feedback-placement.spec.ts', 'tests/e2e/first-day.spec.ts',
  'tests/e2e/help-strip.spec.ts', 'tests/e2e/lab.spec.ts', 'tests/e2e/landscape.spec.ts', 'tests/e2e/lesson-flow.spec.ts',
  'tests/e2e/modes-placement.spec.ts', 'tests/e2e/placement-branches.spec.ts', 'tests/e2e/plan.spec.ts', 'tests/e2e/progress.spec.ts',
  'tests/e2e/projects.spec.ts', 'tests/e2e/session-run.spec.ts', 'tests/e2e/start-and-return.spec.ts', 'tests/e2e/today.spec.ts',
  'tests/e2e/transfer-offer.spec.ts', 'tests/e2e/wide.spec.ts'
)
& 'C:\Program Files\Git\bin\sh.exe' (Join-Path $runs '..\scripts-playwright.sh') 'ruling/e2e-map-4443.txt' '-' '2' @specs
$code2 = $LASTEXITCODE
Set-Content -Path (Join-Path $runs 'e2e-map-4443.exit') -Value "$code2" -Encoding utf8
Set-Content -Path (Join-Path $runs 'chain.exit') -Value "unit=$code e2e=$code2" -Encoding utf8
