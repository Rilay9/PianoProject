# Runs one command from the worktree root, its stdout to runs/Q82/<Name>.txt, stderr to <Name>.stderr.txt and its
# exit code to <Name>.exit. -Strict 1 sets PIANOPATH_STRICT_LICENSE=1 as the Pages job does (pages.yml); -Dir runs it
# from a subfolder (app). -ArgStr is the arguments joined with "|" (powershell -File passes one string); an argument
# with a space in it is passed quoted, since the worktree's path has one.
# Usage: powershell -File scripts-run.ps1 -Name build-before-personal -Exe python -ArgStr "tools/content/build.py|--offline|--out|C:\...\content"
param([string]$Name, [string]$Exe = "python", [string]$ArgStr = "", [string]$Strict = "0", [string]$Dir = "")
$W = "C:\Users\yalir\repos\Piano Stuff\PianoProject\.claude\worktrees\agent-af3e3368f50c0e179"
$Runs = "$W\docs\prompts\runs\Q82"
$Where = if ($Dir -ne "") { "$W\$Dir" } else { $W }
Set-Location $Where
if ($Strict -eq "1") { $env:PIANOPATH_STRICT_LICENSE = "1" } else { Remove-Item Env:PIANOPATH_STRICT_LICENSE -ErrorAction SilentlyContinue }
$env:PYTHONIOENCODING = "utf-8"
$quoted = @($ArgStr -split "\|" | Where-Object { $_ -ne "" } | ForEach-Object { if ($_ -match " ") { "`"$_`"" } else { $_ } })
$p = Start-Process -FilePath $Exe -ArgumentList $quoted -NoNewWindow -Wait -PassThru `
  -RedirectStandardOutput "$Runs\$Name.txt" -RedirectStandardError "$Runs\$Name.stderr.txt"
"$($p.ExitCode)" | Out-File -Encoding ascii "$Runs\$Name.exit"
