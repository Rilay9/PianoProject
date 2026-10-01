# E57a: runs one named check of the lane's chain, its output to build/e57a/<Step>.txt (stderr beside it) and its exit
# code to build/e57a/<Step>.exit; scripts-collect-logs.py copies the kept ones into runs/E57a with machine paths replaced.
# Usage: powershell -File scripts-step.ps1 -Step <name>
#   python-relations  the brief's named Python cases: test_convert's TestALaterTempoMarkSurvives and TestTempoMarks,
#                     test_convert_cache's TestRepairedIdentities, test_measured_truth's TestTheMaterialIdentity (its two
#                     relation tests among them), on the final build
#   content-suite     python -m unittest discover -s tools/content/tests -t tools/content (the map's content-tests)
#   validate          python tools/content/validate.py
#   review-check      python tools/content/review.py --check
#   record-mirrors    python tools/docs/record_mirrors.py --check (never the writing form: the Record block is not this lane's)
#   vitest-all        npx vitest run in app/
#   e2e               the six specs checks_for_paths.py names, on port 4671 through app/build/e57a's config copy, 4 workers
param([string]$Step)
$W = (Resolve-Path "$PSScriptRoot\..\..\..\..").Path
$Logs = "$W\build\e57a"
$env:PYTHONIOENCODING = "utf-8"
Remove-Item Env:PIANOPATH_STRICT_LICENSE -ErrorAction SilentlyContinue
$cwd = $W
switch ($Step) {
  "python-relations" { $exe = "python"; $args_ = @("-m", "unittest", "-v",
      "tests.test_convert.TestALaterTempoMarkSurvives", "tests.test_convert.TestTempoMarks",
      "tests.test_convert_cache.TestRepairedIdentities", "tests.test_measured_truth.TestTheMaterialIdentity");
      $cwd = "$W\tools\content" }
  "content-suite" { $exe = "python"; $args_ = @("-m", "unittest", "discover", "-s", "tools/content/tests", "-t", "tools/content") }
  "validate" { $exe = "python"; $args_ = @("tools/content/validate.py") }
  "review-check" { $exe = "python"; $args_ = @("tools/content/review.py", "--check") }
  "record-mirrors" { $exe = "python"; $args_ = @("tools/docs/record_mirrors.py", "--check") }
  "vitest-all" { $exe = "npx.cmd"; $args_ = @("vitest", "run"); $cwd = "$W\app" }
  "e2e" { $exe = "npx.cmd"; $args_ = @("playwright", "test", "--config", "build/e57a/playwright.e57a.config.ts",
      "tests/e2e/lesson-flow.spec.ts", "tests/e2e/lesson-tools.spec.ts", "tests/e2e/library.spec.ts", "tests/e2e/plan.spec.ts",
      "tests/e2e/side-panel-prose.spec.ts", "tests/e2e/start-and-return.spec.ts", "--workers=4"); $cwd = "$W\app" }
  default { throw "unknown step $Step" }
}
Set-Location $cwd
$p = Start-Process -FilePath $exe -ArgumentList $args_ -NoNewWindow -Wait -PassThru `
  -RedirectStandardOutput "$Logs\$Step.txt" -RedirectStandardError "$Logs\$Step.stderr.txt"
"$($p.ExitCode)" | Out-File -Encoding ascii "$Logs\$Step.exit"
Set-Location $W
