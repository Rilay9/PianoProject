# E50a: the checks the map names after the after build (checks-for-paths.txt), in its order: the whole content
# suite, typecheck, lint, the whole unit suite, the app build, then the six browser specs it names at two
# workers on port 4476 through build/e50a's config copy (never port 4173). Full logs go to build/e50a/ (not
# kept); each step's exit code to build/e50a/checks-exit.txt. Detached; its end marked by checks.exit.
$W = "C:\Users\yalir\repos\Piano Stuff\PianoProject\.claude\worktrees\agent-aa53a621e81c2cb8c"
$L = "$W\build\e50a"
$Exit = "$L\checks-exit.txt"
"" | Out-File -Encoding utf8 $Exit
$env:PYTHONIOENCODING = "utf-8"
function Step([string]$Name, [string]$Cwd, [string]$File, [string[]]$ArgList) {
  Set-Location $Cwd
  $p = Start-Process -FilePath $File -ArgumentList $ArgList -NoNewWindow -Wait -PassThru `
    -RedirectStandardOutput "$L\$Name.txt" -RedirectStandardError "$L\$Name.stderr.txt"
  "$Name exit $($p.ExitCode)" | Out-File -Append -Encoding utf8 $Exit
}
Step "content-suite" $W "python" @("-m", "unittest", "discover", "-s", "tools/content/tests", "-t", "tools/content")
Step "tsc" "$W\app" "npx.cmd" @("tsc", "-b", "--noEmit")
Step "lint" "$W\app" "npm.cmd" @("run", "lint")
Step "vitest" "$W\app" "npx.cmd" @("vitest", "run")
Step "build-app" "$W\app" "npm.cmd" @("run", "build:app")
$env:NODE_PATH = "$W\app\node_modules"
Step "e2e" "$W\app" "npx.cmd" @("playwright", "test", "--config", "`"$L\playwright.e50a-4476.config.ts`"",
  "tests/e2e/placement-branches.spec.ts", "tests/e2e/plan.spec.ts", "tests/e2e/progress.spec.ts",
  "tests/e2e/start-and-return.spec.ts", "tests/e2e/today.spec.ts", "tests/e2e/transfer-offer.spec.ts", "--workers=2")
"done" | Out-File -Encoding ascii "$L\checks.exit"
