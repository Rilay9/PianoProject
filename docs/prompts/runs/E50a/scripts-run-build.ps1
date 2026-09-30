# Runs one offline content build with an absolute --out (X31a's script, paths changed), its output to
# build/e50a/<Name>.txt, stderr to <Name>.stderr.txt and its exit code to <Name>.exit (the logs are trimmed into
# the run folder afterwards: no log over 300 KB is kept there). The three build/*-cache.json files are copied
# again from the main checkout (read only) first, as X31a's did.
# Usage: powershell -File scripts-run-build.ps1 -Name build-before -Out <absolute dir>
param([string]$Name, [string]$Out)
$W = "C:\Users\yalir\repos\Piano Stuff\PianoProject\.claude\worktrees\agent-aa53a621e81c2cb8c"
$M = "C:\Users\yalir\repos\Piano Stuff\PianoProject"
$Logs = "$W\build\e50a"
Set-Location $W
foreach ($f in "demands-cache.json", "positions-cache.json", "notation-cache.json") { Copy-Item "$M\build\$f" "$W\build\$f" -Force }
Remove-Item Env:PIANOPATH_STRICT_LICENSE -ErrorAction SilentlyContinue
$env:PYTHONIOENCODING = "utf-8"
$argList = @("tools/content/build.py", "--offline", "--out", "`"$Out`"")
$p = Start-Process -FilePath "python" -ArgumentList $argList -NoNewWindow -Wait -PassThru `
  -RedirectStandardOutput "$Logs\$Name.txt" -RedirectStandardError "$Logs\$Name.stderr.txt"
"$($p.ExitCode)" | Out-File -Encoding ascii "$Logs\$Name.exit"
