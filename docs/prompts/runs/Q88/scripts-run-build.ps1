# Q88. Runs one content build, its output to runs/Q88/<Name>.txt and its exit code to <Name>.exit (Q80's runner).
# Usage: powershell -File scripts-run-build.ps1 -Name build-strict-full -BuildArgs "--offline" [-Out <abs dir>] [-Strict 1]
# -Out is passed as one quoted argument, since the worktree's path has a space in it.
param([string]$Name, [string]$BuildArgs = "--offline", [string]$Strict = "0", [string]$Out = "")
$W = "C:\Users\yalir\repos\Piano Stuff\PianoProject\.claude\worktrees\agent-ac3ecffe01c1d8440"
$Runs = "$W\docs\prompts\runs\Q88"
Set-Location $W
if ($Strict -eq "1") { $env:PIANOPATH_STRICT_LICENSE = "1" } else { Remove-Item Env:PIANOPATH_STRICT_LICENSE -ErrorAction SilentlyContinue }
$env:PYTHONIOENCODING = "utf-8"
$argList = @("tools/content/build.py") + ($BuildArgs -split " " | Where-Object { $_ -ne "" })
if ($Out -ne "") { $argList += @("--out", "`"$Out`"") }
$p = Start-Process -FilePath "python" -ArgumentList $argList -NoNewWindow -Wait -PassThru `
  -RedirectStandardOutput "$Runs\$Name.txt" -RedirectStandardError "$Runs\$Name.stderr.txt"
"$($p.ExitCode)" | Out-File -Encoding ascii "$Runs\$Name.exit"
