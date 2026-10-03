# G1e: the whole unit suite, detached (a long run outlives a turn), its output in vitest-full.txt and its
# exit in vitest-full.exit. Run from anywhere: the paths are this script's own place.
$runs = Split-Path -Parent $MyInvocation.MyCommand.Path
$worktree = Resolve-Path (Join-Path $runs '..\..\..\..')
$app = Join-Path $worktree 'app'
$log = Join-Path $runs 'vitest-full.txt'
$exit = Join-Path $runs 'vitest-full.exit'
if (Test-Path $exit) { Remove-Item $exit -Confirm:$false }
Set-Location $app
cmd /c "npx vitest run > `"$log`" 2>&1"
$code = $LASTEXITCODE
Add-Content -Path $log -Value "exit=$code" -Encoding utf8
Set-Content -Path $exit -Value "$code" -Encoding utf8
