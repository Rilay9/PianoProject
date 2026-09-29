# Runs one content build, its output to runs/Q80/<Name>.txt and its exit code to <Name>.exit.
# Usage: powershell -File scripts-run-build.ps1 -Name build-baseline-personal -BuildArgs "--offline" [-Out <abs dir>] [-Strict 1]
# -Out is passed as one quoted argument, since the worktree's path has a space in it.
param([string]$Name, [string]$BuildArgs = "--offline", [string]$Strict = "0", [string]$Out = "")
$W = "C:\Users\yalir\repos\Piano Stuff\PianoProject\.claude\worktrees\agent-a3f4947aae693d7cc"
$Runs = "$W\docs\prompts\runs\Q80"
Set-Location $W
if ($Strict -eq "1") { $env:PIANOPATH_STRICT_LICENSE = "1" } else { Remove-Item Env:PIANOPATH_STRICT_LICENSE -ErrorAction SilentlyContinue }
$env:PYTHONIOENCODING = "utf-8"
$argList = @("tools/content/build.py") + ($BuildArgs -split " " | Where-Object { $_ -ne "" })
if ($Out -ne "") { $argList += @("--out", "`"$Out`"") }
$p = Start-Process -FilePath "python" -ArgumentList $argList -NoNewWindow -Wait -PassThru `
  -RedirectStandardOutput "$Runs\$Name.txt" -RedirectStandardError "$Runs\$Name.stderr.txt"
"$($p.ExitCode)" | Out-File -Encoding ascii "$Runs\$Name.exit"
