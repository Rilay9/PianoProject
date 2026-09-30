# L120b's checks after class 2 (the map's minimum, checks-for-paths.txt, less the content build, which the
# after-gate re-run is): the validator, the record check, the whole content suite, the typecheck, the lint,
# the whole unit suite on the rebuilt content, the app build. One at a time, detached; each log under
# build\l120b-checks, each exit code in chain-checks-exit.txt. The browser specs the map names run apart,
# on port 4474 through a config copy (scripts-e2e.ps1).
$work = (Resolve-Path (Join-Path $PSScriptRoot '..\..\..\..')).Path
$logs = Join-Path $work 'build\l120b-checks'
New-Item -ItemType Directory -Force $logs | Out-Null
$exit = Join-Path $work 'docs\prompts\runs\L120b\chain-checks-exit.txt'
"L120b chain checks, one at a time" | Out-File -Encoding utf8 $exit
function Step([string]$name, [string]$dir, [string]$command) {
  Set-Location (Join-Path $work $dir)
  $log = Join-Path $logs "$name.txt"
  $command | Out-File -Encoding utf8 $log
  cmd /c "$command >> `"$log`" 2>&1"
  "$name exit=$LASTEXITCODE" | Out-File -Append -Encoding utf8 $exit
}
Step 'content-validate' '.' 'python tools\content\validate.py --allow-nc --personal'
Step 'review-check' '.' 'python tools\content\review.py --check'
Step 'content-tests' '.' 'python -m unittest discover -s tools/content/tests -t tools/content'
Step 'tsc' 'app' 'npx tsc -b'
Step 'lint' 'app' 'npm run lint'
Step 'unit' 'app' 'npx vitest run'
Step 'build-app' 'app' 'npm run build:app'
Set-Location $work
cmd /c "git status --short >> `"$exit`" 2>&1"
"done" | Out-File -Encoding utf8 (Join-Path $logs 'chain-done.txt')
