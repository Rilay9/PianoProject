# G1e ruling: the reruns after the chain. (1) app-shell.spec.ts and wide.spec.ts on port 4443, this tree's build, two
# workers, with the lane's storage state naming 4443 (the chain's ten failures were the setup tour and first-sight
# cards the default fixture only skips on localhost:4173); (2) the unit file that timed out under load,
# expectedNote.test.ts, alone. Logs e2e-rerun-4443.txt and vitest-rerun-expectedNote.txt; rerun.exit at the end.
$runs = Split-Path -Parent $MyInvocation.MyCommand.Path
$worktree = Resolve-Path (Join-Path $runs '..\..\..\..\..')
$exit = Join-Path $runs 'rerun.exit'
if (Test-Path $exit) { Remove-Item $exit -Confirm:$false }
& 'C:\Program Files\Git\bin\sh.exe' (Join-Path $runs '..\scripts-playwright.sh') 'ruling/e2e-rerun-4443.txt' '-' '2' 'tests/e2e/app-shell.spec.ts' 'tests/e2e/wide.spec.ts'
$e2e = $LASTEXITCODE
Set-Location (Join-Path $worktree 'app')
$log = Join-Path $runs 'vitest-rerun-expectedNote.txt'
cmd /c "npx vitest run tests/unit/expectedNote.test.ts > `"$log`" 2>&1"
$unit = $LASTEXITCODE
Add-Content -Path $log -Value "exit=$unit" -Encoding utf8
Set-Content -Path $exit -Value "e2e=$e2e unit=$unit" -Encoding utf8
