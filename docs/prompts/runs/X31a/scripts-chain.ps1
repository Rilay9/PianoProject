# X31a's detached chain after the builds: the fit report (for information), the plain validator (the map's
# content-validate), the whole content suite (the map's content-tests), the whole unit suite (the map's unit), and
# the app build (the map's build-app). Each step's output to runs/X31a/<name>.txt with "exit=<code>" appended; the
# chain's summary to chain-exit.txt, written last (the file that ends it).
$W = "C:\Users\yalir\repos\Piano Stuff\PianoProject\.claude\worktrees\agent-a0640d9cf113db364"
$Runs = "$W\docs\prompts\runs\X31a"
$env:PYTHONIOENCODING = "utf-8"
$summary = @()
function Step([string]$Name, [string]$Dir, [string]$Exe, [string[]]$ArgList) {
  Set-Location $Dir
  $p = Start-Process -FilePath $Exe -ArgumentList $ArgList -NoNewWindow -Wait -PassThru `
    -RedirectStandardOutput "$Runs\$Name.txt" -RedirectStandardError "$Runs\$Name.stderr.txt"
  "exit=$($p.ExitCode)" | Out-File -Append -Encoding utf8 "$Runs\$Name.txt"
  return "$Name $($p.ExitCode)"
}
$summary += Step "fit-report" $W "python" @("`"$Runs\scripts-fit-report.py`"", "`"$W\app\public\content`"")
$summary += Step "validate-plain" $W "python" @("tools/content/validate.py")
$summary += Step "content-suite" $W "python" @("-m", "unittest", "discover", "-s", "tools/content/tests", "-t", "tools/content")
$summary += Step "vitest-all" "$W\app" "cmd.exe" @("/c", "npx", "vitest", "run")
$summary += Step "build-app" "$W\app" "cmd.exe" @("/c", "npm", "run", "build:app")
$summary | Out-File -Encoding utf8 "$Runs\chain-exit.txt"
