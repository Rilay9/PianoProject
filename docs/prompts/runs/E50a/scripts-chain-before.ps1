# E50a: the setup, then the before build on the base (2da6b8ef) before any edit of tools/content, into an
# absolute --out under the worktree's gitignored build/. Detached (Start-Process), its end marked by
# build/e50a/chain-before.exit.
$W = "C:\Users\yalir\repos\Piano Stuff\PianoProject\.claude\worktrees\agent-aa53a621e81c2cb8c"
$Runs = "$W\docs\prompts\runs\E50a"
& powershell -NoProfile -ExecutionPolicy Bypass -File "$Runs\scripts-setup.ps1"
& powershell -NoProfile -ExecutionPolicy Bypass -File "$Runs\scripts-run-build.ps1" -Name build-before -Out "$W\build\e50a\before\content"
"done" | Out-File -Encoding ascii "$W\build\e50a\chain-before.exit"
