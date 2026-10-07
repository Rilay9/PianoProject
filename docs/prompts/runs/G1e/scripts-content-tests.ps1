# G1e: the map fallback's content tests, detached (the foreground run was cut off by the shell's ten-minute
# limit, exit 124, fallback-content-tests-cut-off.txt); output in fallback-content-tests.txt, exit in
# fallback-content-tests.exit. Run from anywhere: the paths are this script's own place.
$runs = Split-Path -Parent $MyInvocation.MyCommand.Path
$worktree = Resolve-Path (Join-Path $runs '..\..\..\..')
$log = Join-Path $runs 'fallback-content-tests.txt'
$exit = Join-Path $runs 'fallback-content-tests.exit'
if (Test-Path $exit) { Remove-Item $exit -Confirm:$false }
Set-Location $worktree
cmd /c "python -m unittest discover -s tools/content/tests -t tools/content > `"$log`" 2>&1"
$code = $LASTEXITCODE
Add-Content -Path $log -Value "exit=$code" -Encoding utf8
Set-Content -Path $exit -Value "$code" -Encoding utf8
