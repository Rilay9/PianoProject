# E59's checks on the final build (the map's minimum, `tools/docs/checks_for_paths.py`, beside the lane's own): each step's
# output to build/e59/<step>.txt and its exit code appended to build/e59/exit-codes.txt; never stops on a red step, so every
# exit code is read. Usage: powershell -File scripts-chain.ps1 [-Steps validate,review,...]
param([string[]]$Steps = @("validate", "review-check", "record-mirrors", "content-tests", "tsc", "lint", "vitest-all", "build-app"))
$W = (Resolve-Path "$PSScriptRoot\..\..\..\..").Path
$Logs = "$W\build\e59"
$env:PYTHONIOENCODING = "utf-8"
$Commands = @{
  "validate"       = @("$W", "python", @("tools/content/validate.py"));
  "review-check"   = @("$W", "python", @("tools/content/review.py", "--check"));
  "record-mirrors" = @("$W", "python", @("tools/docs/record_mirrors.py", "--check"));
  "content-tests"  = @("$W", "python", @("-m", "unittest", "discover", "-s", "tools/content/tests", "-t", "tools/content"));
  "tsc"            = @("$W\app", "npx.cmd", @("tsc", "-b", "--noEmit"));
  "lint"           = @("$W\app", "npm.cmd", @("run", "lint"));
  "vitest-all"     = @("$W\app", "npx.cmd", @("vitest", "run"));
  "build-app"      = @("$W\app", "npm.cmd", @("run", "build:app"));
}
foreach ($step in $Steps) {
  $c = $Commands[$step]
  $p = Start-Process -FilePath $c[1] -ArgumentList $c[2] -WorkingDirectory $c[0] -NoNewWindow -Wait -PassThru `
    -RedirectStandardOutput "$Logs\$step.txt" -RedirectStandardError "$Logs\$step.stderr.txt"
  "$step $($p.ExitCode)" | Out-File -Append -Encoding ascii "$Logs\exit-codes.txt"
}
"done" | Out-File -Encoding ascii "$Logs\chain.exit"
