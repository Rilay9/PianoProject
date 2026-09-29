# L120a's checks, detached: what the map names for the changed paths (checks-for-paths.txt) apart from the
# content build, which ran on this tree before the tool existed and does not read it (content-build.txt;
# build.py and validate.py import no untaught_options). Each check's output and exit code to its own file;
# the three files a build rewrites restored from the snapshot afterwards, as a precaution.
$work = (Resolve-Path (Join-Path $PSScriptRoot '..\..\..\..')).Path
$runs = Join-Path $work 'docs\prompts\runs\L120a'
$env:PYTHONIOENCODING = 'utf-8'
function Step($name, $dir, $command) {
  $out = Join-Path $runs "$name.txt"
  "$command   (in $dir)" | Out-File -Encoding utf8 $out
  Push-Location (Join-Path $work $dir)
  cmd /c "$command >> `"$out`" 2>&1"
  $code = $LASTEXITCODE
  Pop-Location
  "exit=$code" | Out-File -Append -Encoding utf8 $out
  "$name exit=$code" | Out-File -Append -Encoding utf8 (Join-Path $runs 'chain-checks-exit.txt')
}
"chain-checks" | Out-File -Encoding utf8 (Join-Path $runs 'chain-checks-exit.txt')
Step 'green-test_untaught_options' '.' 'python -m unittest tools/content/tests/test_untaught_options.py -v'
Step 'content-validate' '.' 'python tools/content/validate.py'
Step 'review-check' '.' 'python tools/content/review.py --check'
Step 'content-tests' '.' 'python -m unittest discover -s tools/content/tests -t tools/content'
Step 'unit' 'app' 'npx vitest run'
Step 'build-app' 'app' 'npm run build:app'
Copy-Item (Join-Path $work 'build\l120a-snapshot\SOURCES.md') (Join-Path $work 'content\scores\imported\SOURCES.md') -Force
Copy-Item (Join-Path $work 'build\l120a-snapshot\inventory.md') (Join-Path $work 'docs\prompts\inventory.md') -Force
Copy-Item (Join-Path $work 'build\l120a-snapshot\rung-claims.md') (Join-Path $work 'docs\prompts\rung-claims.md') -Force
"done" | Out-File -Append -Encoding utf8 (Join-Path $runs 'chain-checks-exit.txt')
