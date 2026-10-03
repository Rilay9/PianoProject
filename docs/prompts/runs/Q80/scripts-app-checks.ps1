# The map's app checks for tools/content/*.py (checks-for-paths.txt): the unit suite, then the app build.
$W = "C:\Users\yalir\repos\Piano Stuff\PianoProject\.claude\worktrees\agent-a3f4947aae693d7cc"
$Runs = "$W\docs\prompts\runs\Q80"
Set-Location "$W\app"
$p = Start-Process -FilePath "cmd.exe" -ArgumentList @("/c", "npx vitest run > `"$Runs\vitest-all.txt`" 2>&1") -NoNewWindow -Wait -PassThru
"$($p.ExitCode)" | Out-File -Encoding ascii "$Runs\vitest-all.exit"
$p = Start-Process -FilePath "cmd.exe" -ArgumentList @("/c", "npm run build:app > `"$Runs\build-app.txt`" 2>&1") -NoNewWindow -Wait -PassThru
"$($p.ExitCode)" | Out-File -Encoding ascii "$Runs\build-app.exit"
