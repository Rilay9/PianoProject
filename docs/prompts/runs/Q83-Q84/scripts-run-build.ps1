# Runs one content build, its output to runs/Q83-Q84/<Name>.txt and its exit code to <Name>.exit (written last, so
# the .exit file's appearance ends the run). Q80's script, with the three build/*-cache.json files copied fresh from
# the main checkout (read only) before the build, as Q80's second chain learned to (its Follow-up 4).
# Usage: powershell -File scripts-run-build.ps1 -Name <name> [-BuildArgs "--offline"] [-Out <abs dir>] [-Strict 1]
param([string]$Name, [string]$BuildArgs = "--offline", [string]$Strict = "0", [string]$Out = "")
$W = "C:\Users\yalir\repos\Piano Stuff\PianoProject\.claude\worktrees\agent-afba154b2e72a57f9"
$M = "C:\Users\yalir\repos\Piano Stuff\PianoProject"
$Runs = "$W\docs\prompts\runs\Q83-Q84"
Set-Location $W
Remove-Item "$Runs\$Name.exit" -ErrorAction SilentlyContinue
foreach ($f in "demands-cache.json", "positions-cache.json", "notation-cache.json") { Copy-Item "$M\build\$f" "$W\build\$f" -Force }
if ($Strict -eq "1") { $env:PIANOPATH_STRICT_LICENSE = "1" } else { Remove-Item Env:PIANOPATH_STRICT_LICENSE -ErrorAction SilentlyContinue }
$env:PYTHONIOENCODING = "utf-8"
$argList = @("tools/content/build.py") + ($BuildArgs -split " " | Where-Object { $_ -ne "" })
if ($Out -ne "") { $argList += @("--out", "`"$Out`"") }
$p = Start-Process -FilePath "python" -ArgumentList $argList -NoNewWindow -Wait -PassThru `
  -RedirectStandardOutput "$Runs\$Name.txt" -RedirectStandardError "$Runs\$Name.stderr.txt"
"$($p.ExitCode)" | Out-File -Encoding ascii "$Runs\$Name.exit"
