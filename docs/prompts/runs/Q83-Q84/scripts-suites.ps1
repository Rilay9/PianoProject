# Q83+Q84: the suites the map names for the changed paths, on the final build's content, one after another (never
# two at once): the whole content suite, then from app/ the whole unit suite and the app build. Each writes its
# output and exit code; suites.exit is written last and ends the chain.
$W = "C:\Users\yalir\repos\Piano Stuff\PianoProject\.claude\worktrees\agent-afba154b2e72a57f9"
$Runs = "$W\docs\prompts\runs\Q83-Q84"
Remove-Item "$Runs\suites.exit" -ErrorAction SilentlyContinue
$env:PYTHONIOENCODING = "utf-8"
Set-Location $W
$p = Start-Process -FilePath "python" -ArgumentList @("-m", "unittest", "discover", "-s", "tools/content/tests", "-t", "tools/content") `
  -NoNewWindow -Wait -PassThru -RedirectStandardOutput "$Runs\content-tests-all.stdout.txt" -RedirectStandardError "$Runs\content-tests-all.txt"
"$($p.ExitCode)" | Out-File -Encoding ascii "$Runs\content-tests-all.exit"
Set-Location "$W\app"
$p = Start-Process -FilePath "cmd.exe" -ArgumentList @("/c", "npx vitest run") -NoNewWindow -Wait -PassThru `
  -RedirectStandardOutput "$Runs\vitest-all.txt" -RedirectStandardError "$Runs\vitest-all.stderr.txt"
"$($p.ExitCode)" | Out-File -Encoding ascii "$Runs\vitest-all.exit"
$p = Start-Process -FilePath "cmd.exe" -ArgumentList @("/c", "npm run build:app") -NoNewWindow -Wait -PassThru `
  -RedirectStandardOutput "$Runs\build-app.txt" -RedirectStandardError "$Runs\build-app.stderr.txt"
"$($p.ExitCode)" | Out-File -Encoding ascii "$Runs\build-app.exit"
"0" | Out-File -Encoding ascii "$Runs\suites.exit"
