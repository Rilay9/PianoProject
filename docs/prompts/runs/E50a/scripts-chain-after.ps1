# E50a: the after build, with the change, into the absolute default place (app/public/content, so the unit
# suite reads it), then the validator and the review check on it. Detached (Start-Process), its end marked by
# build/e50a/chain-after.exit.
$W = "C:\Users\yalir\repos\Piano Stuff\PianoProject\.claude\worktrees\agent-aa53a621e81c2cb8c"
$Runs = "$W\docs\prompts\runs\E50a"
& powershell -NoProfile -ExecutionPolicy Bypass -File "$Runs\scripts-run-build.ps1" -Name build-after -Out "$W\app\public\content"
Set-Location $W
$env:PYTHONIOENCODING = "utf-8"
$p = Start-Process -FilePath "python" -ArgumentList @("tools/content/validate.py", "--dir", "`"$W\app\public\content`"", "--allow-nc", "--personal") -NoNewWindow -Wait -PassThru `
  -RedirectStandardOutput "$Runs\validate-after.txt" -RedirectStandardError "$W\build\e50a\validate-after.stderr.txt"
"exit $($p.ExitCode)" | Out-File -Append -Encoding utf8 "$Runs\validate-after.txt"
$p = Start-Process -FilePath "python" -ArgumentList @("tools/content/review.py", "--check", "--content", "`"$W\app\public\content`"") -NoNewWindow -Wait -PassThru `
  -RedirectStandardOutput "$Runs\review-check-after.txt" -RedirectStandardError "$W\build\e50a\review-check-after.stderr.txt"
"exit $($p.ExitCode)" | Out-File -Append -Encoding utf8 "$Runs\review-check-after.txt"
"done" | Out-File -Encoding ascii "$W\build\e50a\chain-after.exit"
