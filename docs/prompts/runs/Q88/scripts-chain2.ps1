# Q88, the second chain: the personal build again (the first chain's failed on a MemoryError while decompressing a
# score in attach_notation, with bash forks failing on this machine in the same minutes: build-personal-memoryerror.*),
# then every check the map names for the changed paths (checks-for-paths.txt), and the guard on the app build's
# dist/content, the directory the Pages step reads. One log (chain2.txt), one exit file (chain2.exit); each step's
# output and exit code in its own files. The three files a build rewrites are copied back from the first chain's
# snapshot (build/q88-snapshot, taken before any build) after the build.
$W = "C:\Users\yalir\repos\Piano Stuff\PianoProject\.claude\worktrees\agent-ac3ecffe01c1d8440"
$M = "C:\Users\yalir\repos\Piano Stuff\PianoProject"
$Runs = "$W\docs\prompts\runs\Q88"
$Run = "$Runs\scripts-run-build.ps1"
$Snap = "$W\build\q88-snapshot"
$Log = "$Runs\chain2.txt"
$Kept = @("content\scores\imported\SOURCES.md", "docs\prompts\inventory.md", "docs\prompts\rung-claims.md")
function Say($line) { "$(Get-Date -Format HH:mm:ss) $line" | Out-File -Append -Encoding utf8 $Log }
function Step($name, $file, $argList, $dir) {
  Say "start $name"
  $p = Start-Process -FilePath $file -ArgumentList $argList -WorkingDirectory $dir -NoNewWindow -Wait -PassThru `
    -RedirectStandardOutput "$Runs\$name.txt" -RedirectStandardError "$Runs\$name.stderr.txt"
  "$($p.ExitCode)" | Out-File -Encoding ascii "$Runs\$name.exit"
  Say "done $name exit $($p.ExitCode)"
}

"" | Out-File -Encoding utf8 $Log
Set-Location $W
$env:PYTHONIOENCODING = "utf-8"
Remove-Item Env:PIANOPATH_STRICT_LICENSE -ErrorAction SilentlyContinue

# 1. The map's content-build: the personal build to the default out (CI's flavour; Q24's fresh-worktree build).
foreach ($f in "demands-cache.json", "positions-cache.json", "notation-cache.json") { Copy-Item "$M\build\$f" "$W\build\$f" -Force }
Say "caches copied from the main checkout"
Say "start build-personal"
& powershell -NoProfile -ExecutionPolicy Bypass -File $Run -Name "build-personal" -BuildArgs "--offline" -Strict "0"
Say "done build-personal exit $(Get-Content "$Runs\build-personal.exit")"
foreach ($f in $Kept) { Copy-Item "$Snap\$f" "$W\$f" -Force }
& git -C $W status --short | Out-File -Encoding utf8 "$Runs\restore2.txt"
Say "snapshot restored; git status in restore2.txt"

# 2. The map's other checks, in its order.
Step "validate-personal" "python" @("tools/content/validate.py") $W
Step "review-check" "python" @("tools/content/review.py", "--check") $W
Step "content-tests-all" "python" @("-m", "unittest", "discover", "-s", "tools/content/tests", "-t", "tools/content") $W
Step "vitest-all" "npx.cmd" @("vitest", "run") "$W\app"
Step "build-app" "npm.cmd" @("run", "build:app") "$W\app"

# 3. The guard on the directory the Pages step reads, after the app build wrote it (the personal flavour here).
Step "guard-dist-personal" "python" @("tools/content/deploy_guard.py", "--dir", "app/dist/content") $W

& git -C $W status --short | Out-File -Encoding utf8 "$Runs\status-final.txt"
Say "chain2 finished"
"0" | Out-File -Encoding ascii "$Runs\chain2.exit"
