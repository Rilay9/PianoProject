# X31a: runs scripts-corpus-bpm.py detached on the after build (app/public/content), output to
# runs/X31a/corpus-bpm-run.txt (stdout) and corpus-bpm-run.stderr.txt, the data to corpus-bpm.jsonl, the exit code
# to corpus-bpm-run.exit.
$W = "C:\Users\yalir\repos\Piano Stuff\PianoProject\.claude\worktrees\agent-a0640d9cf113db364"
$Runs = "$W\docs\prompts\runs\X31a"
Set-Location $W
$env:PYTHONIOENCODING = "utf-8"
$argList = @("`"$Runs\scripts-corpus-bpm.py`"", "`"$Runs\corpus-bpm.jsonl`"", "`"$W\app\public\content`"", "4")
$p = Start-Process -FilePath "python" -ArgumentList $argList -NoNewWindow -Wait -PassThru `
  -RedirectStandardOutput "$Runs\corpus-bpm-run.txt" -RedirectStandardError "$Runs\corpus-bpm-run.stderr.txt"
"$($p.ExitCode)" | Out-File -Encoding ascii "$Runs\corpus-bpm-run.exit"
