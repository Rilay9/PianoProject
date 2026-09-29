# G1e: the map's browser specs for the changed code paths (checks-for-paths-without-lane-config.txt: twelve
# specs, projects.spec.ts and today.spec.ts among them), on port 4443 through scripts-playwright.sh, two
# workers, this tree's build (app/dist). Detached (a long run outlives a turn); the log is e2e-map-4443.txt and
# its exit is in e2e-map-4443.exit.
$runs = Split-Path -Parent $MyInvocation.MyCommand.Path
$exit = Join-Path $runs 'e2e-map-4443.exit'
if (Test-Path $exit) { Remove-Item $exit -Confirm:$false }
$specs = @(
  'tests/e2e/first-day.spec.ts', 'tests/e2e/lab.spec.ts', 'tests/e2e/lesson-flow.spec.ts', 'tests/e2e/modes-placement.spec.ts',
  'tests/e2e/placement-branches.spec.ts', 'tests/e2e/plan.spec.ts', 'tests/e2e/progress.spec.ts', 'tests/e2e/projects.spec.ts',
  'tests/e2e/session-run.spec.ts', 'tests/e2e/start-and-return.spec.ts', 'tests/e2e/today.spec.ts', 'tests/e2e/transfer-offer.spec.ts'
)
& 'C:\Program Files\Git\bin\sh.exe' (Join-Path $runs 'scripts-playwright.sh') 'e2e-map-4443.txt' '-' '2' @specs
$code = $LASTEXITCODE
Set-Content -Path $exit -Value "$code" -Encoding utf8
